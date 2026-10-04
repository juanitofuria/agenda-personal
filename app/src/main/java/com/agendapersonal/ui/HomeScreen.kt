package com.agendapersonal.ui

import android.app.TimePickerDialog
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.agendapersonal.data.Prefs
import com.agendapersonal.notify.Scheduler
import com.agendapersonal.sections.DigestStore
import com.agendapersonal.sections.Section
import com.agendapersonal.sections.SectionRegistry
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.Calendar
import java.util.Date
import java.util.Locale

private val ES = Locale("es", "ES")

@Composable
fun HomeScreen(onOpen: (String) -> Unit) {
    val ctx = LocalContext.current
    val prefs = remember { Prefs(ctx) }
    val scope = rememberCoroutineScope()
    var version by remember { mutableIntStateOf(0) }
    var refreshingAll by remember { mutableStateOf(false) }
    val loadingIds = remember { mutableStateListOf<String>() }

    suspend fun refresh(section: Section) {
        loadingIds += section.id
        DigestStore.refresh(ctx, section)
        loadingIds -= section.id
        version++
    }

    // Primer uso: las secciones sin datos guardados se rellenan solas.
    LaunchedEffect(Unit) {
        SectionRegistry.all.filter { DigestStore.load(ctx, it.id) == null }.forEach { refresh(it) }
    }

    LazyColumn(
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Hero(prefs, version, refreshingAll) {
                refreshingAll = true
                scope.launch {
                    SectionRegistry.all.forEach { refresh(it) }
                    refreshingAll = false
                }
            }
        }
        if (!Scheduler.canScheduleExact(ctx)) item { ExactAlarmWarning() }
        item { Text("Tus resúmenes", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 6.dp)) }
        items(SectionRegistry.all, key = { it.id }) { section ->
            SectionCard(
                section, prefs, version,
                loading = section.id in loadingIds,
                onChange = { version++ },
                onRefresh = { scope.launch { refresh(section) } },
                onOpen = { onOpen(section.id) },
            )
        }
    }
}

@Composable
private fun Hero(prefs: Prefs, version: Int, refreshing: Boolean, onRefreshAll: () -> Unit) {
    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    val greeting = when { hour < 6 -> "Buenas noches"; hour < 14 -> "Buenos días"; hour < 21 -> "Buenas tardes"; else -> "Buenas noches" }
    val date = SimpleDateFormat("EEEE, d 'de' MMMM", ES).format(Date()).replaceFirstChar { it.uppercase() }
    val next = remember(version) { nextAlert(prefs) }
    val brush = Brush.linearGradient(listOf(Color(0xFF3B5BDB), Color(0xFF7048E8)))

    Column(
        Modifier.fillMaxWidth().clip(MaterialTheme.shapes.extraLarge).background(brush).padding(22.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Column {
            Text(greeting, style = MaterialTheme.typography.headlineMedium, color = Color.White)
            Text(date, style = MaterialTheme.typography.bodyLarge, color = Color.White.copy(alpha = 0.85f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            HeroChip(Icons.Rounded.LocationOn, prefs.placeName)
            next?.let { HeroChip(Icons.Rounded.NotificationsActive, it) }
        }
        Button(
            onClick = onRefreshAll, enabled = !refreshing,
            colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color(0xFF2B3FA8), disabledContainerColor = Color.White.copy(alpha = 0.6f)),
            modifier = Modifier.fillMaxWidth().height(48.dp),
        ) {
            if (refreshing) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp, color = Color(0xFF2B3FA8))
            else Icon(Icons.Rounded.Refresh, null, Modifier.size(20.dp))
            Spacer(Modifier.width(8.dp))
            Text(if (refreshing) "Actualizando…" else "Actualizar todo ahora")
        }
    }
}

@Composable
private fun HeroChip(icon: ImageVector, text: String) {
    Row(
        Modifier.clip(MaterialTheme.shapes.extraLarge).background(Color.White.copy(alpha = 0.18f)).padding(horizontal = 10.dp, vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, null, tint = Color.White, modifier = Modifier.size(15.dp))
        Spacer(Modifier.width(5.dp))
        Text(text, style = MaterialTheme.typography.labelMedium, color = Color.White, maxLines = 1)
    }
}

/** "Tiempo · 07:00" del próximo aviso programado. */
private fun nextAlert(prefs: Prefs): String? {
    val best = SectionRegistry.all.filter { prefs.isEnabled(it.id) }.map {
        val h = prefs.hour(it.id, it.defaultHour); val m = prefs.minute(it.id, it.defaultMinute)
        Triple(it, h, m) to Scheduler.nextTrigger(h, m)
    }.minByOrNull { it.second } ?: return null
    val (s, h, m) = best.first
    val day = LocalDate.ofInstant(Instant.ofEpochMilli(best.second), ZoneId.systemDefault())
    val label = if (day == LocalDate.now()) "" else " (mañana)"
    return "${s.title} · %02d:%02d$label".format(h, m)
}

@Composable
private fun ExactAlarmWarning() {
    val ctx = LocalContext.current
    Row(
        Modifier.fillMaxWidth().clip(MaterialTheme.shapes.large).background(MaterialTheme.colorScheme.errorContainer).padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(Icons.Rounded.AlarmOff, null, tint = MaterialTheme.colorScheme.onErrorContainer)
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text("Avisos sin hora exacta", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.onErrorContainer)
            Text("Concede «Alarmas y recordatorios» para que lleguen a su hora.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onErrorContainer)
        }
        if (Build.VERSION.SDK_INT >= 31) TextButton(onClick = {
            ctx.startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${ctx.packageName}")))
        }) { Text("Permitir") }
    }
}

@Composable
fun SectionCard(
    section: Section, prefs: Prefs, version: Int, loading: Boolean,
    onChange: () -> Unit, onRefresh: () -> Unit, onOpen: () -> Unit,
) {
    val ctx = LocalContext.current
    val style = sectionStyle(section.id)

    val enabled = remember(version) { prefs.isEnabled(section.id) }
    val hour = remember(version) { prefs.hour(section.id, section.defaultHour) }
    val minute = remember(version) { prefs.minute(section.id, section.defaultMinute) }
    val stored = remember(version, loading) { DigestStore.load(ctx, section.id) }

    AppCard(Modifier.fillMaxWidth(), onClick = onOpen) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconBadge(style.icon, style.color, modifier = Modifier.alpha(if (enabled) 1f else 0.45f))
                Spacer(Modifier.width(14.dp))
                Column(Modifier.weight(1f).padding(end = 12.dp)) {
                    Text(section.title, style = MaterialTheme.typography.titleMedium)
                    Text(
                        stored?.let { "Actualizado ${DigestStore.relative(it.at)}" } ?: section.description,
                        style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Switch(checked = enabled, onCheckedChange = {
                    prefs.setEnabled(section.id, it)
                    Scheduler.scheduleSection(ctx, section)
                    onChange()
                })
            }

            // Últimos datos guardados de la sección.
            Column(
                Modifier.fillMaxWidth().clip(MaterialTheme.shapes.medium).background(style.color.copy(alpha = 0.08f)).padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(7.dp),
            ) {
                when {
                    loading && stored == null -> Row(verticalAlignment = Alignment.CenterVertically) {
                        CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp, color = style.color)
                        Spacer(Modifier.width(10.dp))
                        Text("Obteniendo datos…", style = MaterialTheme.typography.bodyMedium)
                    }
                    stored == null -> Text("Aún sin datos. Pulsa «Actualizar».", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    else -> {
                        val lines = stored.preview.ifEmpty { listOf(stored.summary) }.take(4)
                        lines.forEach { Text(it, style = MaterialTheme.typography.bodyMedium, maxLines = 2, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis) }
                    }
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AssistChip(
                    onClick = {
                        TimePickerDialog(ctx, { _, h, m ->
                            prefs.setTime(section.id, h, m)
                            Scheduler.scheduleSection(ctx, section)
                            onChange()
                        }, hour, minute, true).show()
                    },
                    label = { Text("%02d:%02d".format(hour, minute)) },
                    leadingIcon = { Icon(Icons.Rounded.Schedule, null, Modifier.size(18.dp)) },
                    modifier = Modifier.alpha(if (enabled) 1f else 0.5f),
                )
                Spacer(Modifier.weight(1f))
                TextButton(onClick = onOpen) { Text("Ver todo") }
                FilledTonalButton(onClick = onRefresh, enabled = !loading, contentPadding = PaddingValues(horizontal = 16.dp)) {
                    if (loading) CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                    else Icon(Icons.Rounded.Refresh, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(if (loading) "Cargando" else "Actualizar")
                }
            }
        }
    }
}
