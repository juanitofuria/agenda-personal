package com.agendapersonal.ui

import android.app.TimePickerDialog
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.agendapersonal.data.Prefs
import com.agendapersonal.notify.Notifier
import com.agendapersonal.notify.Scheduler
import com.agendapersonal.sections.DigestStore
import com.agendapersonal.sections.Section
import com.agendapersonal.sections.SectionRegistry
import kotlinx.coroutines.launch

@Composable
fun DigestsScreen() {
    val ctx = LocalContext.current
    val prefs = remember { Prefs(ctx) }
    var version by remember { mutableIntStateOf(0) } // fuerza releer ajustes
    var dialog by remember { mutableStateOf<Pair<String, String>?>(null) }

    dialog?.let { (t, b) -> TextDialog(t, b) { dialog = null } }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            var refreshing by remember { mutableStateOf(false) }
            val scope = rememberCoroutineScope()
            Button(
                enabled = !refreshing,
                modifier = Modifier.fillMaxWidth(),
                onClick = {
                    refreshing = true
                    scope.launch {
                        SectionRegistry.all.forEach { DigestStore.refresh(ctx, it); version++ }
                        refreshing = false
                    }
                },
            ) { Text(if (refreshing) "Actualizando todo…" else "🔄 Actualizar todo ahora") }
        }
        item {
            if (!Scheduler.canScheduleExact(ctx)) {
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)) {
                    Text(
                        "Para que los avisos lleguen a la hora exacta, concede el permiso de alarmas exactas en Ajustes.",
                        Modifier.padding(12.dp),
                    )
                }
            }
        }
        items(SectionRegistry.all, key = { it.id }) { section ->
            SectionCard(section, prefs, version, onChange = { version++ }, onShow = { dialog = it })
        }
    }
}

@Composable
private fun SectionCard(
    section: Section,
    prefs: Prefs,
    version: Int,
    onChange: () -> Unit,
    onShow: (Pair<String, String>) -> Unit,
) {
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    var loading by remember { mutableStateOf(false) }

    val enabled = remember(version) { prefs.isEnabled(section.id) }
    val hour = remember(version) { prefs.hour(section.id, section.defaultHour) }
    val minute = remember(version) { prefs.minute(section.id, section.defaultMinute) }
    val last = remember(version, loading) { prefs.lastDigest(section.id) }

    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(section.title, style = MaterialTheme.typography.titleMedium)
                    Text(section.description, style = MaterialTheme.typography.bodySmall)
                }
                Switch(checked = enabled, onCheckedChange = {
                    prefs.setEnabled(section.id, it)
                    Scheduler.scheduleSection(ctx, section)
                    onChange()
                })
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                OutlinedButton(onClick = {
                    TimePickerDialog(ctx, { _, h, m ->
                        prefs.setTime(section.id, h, m)
                        Scheduler.scheduleSection(ctx, section)
                        onChange()
                    }, hour, minute, true).show()
                }) { Text("⏰ %02d:%02d".format(hour, minute)) }

                Button(enabled = !loading, onClick = {
                    loading = true
                    scope.launch {
                        val digest = DigestStore.refresh(ctx, section)
                        loading = false
                        onChange()
                        if (digest != null && digest.ok) onShow(digest.title to digest.body)
                        else onShow(
                            section.title to (digest?.body?.takeIf { it.isNotBlank() }
                                ?: "No se pudo obtener la información. Revisa tu conexión."),
                        )
                    }
                }) { Text(if (loading) "Cargando…" else "🔄 Actualizar ahora") }

                if (last != null) TextButton(onClick = { onShow(section.title to last) }) { Text("Último") }
            }
            last?.lineSequence()?.firstOrNull()?.let {
                Text("Última actualización: ${it.substringAfterLast(" · ")}", style = MaterialTheme.typography.bodySmall)
            }
            TextButton(onClick = {
                scope.launch {
                    val d = runCatching { section.build(ctx) }.getOrNull() ?: return@launch
                    Notifier.postDigest(ctx, section.id, d)
                }
            }) { Text("Enviar notificación de prueba") }
        }
    }
}
