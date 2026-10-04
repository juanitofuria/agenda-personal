package com.agendapersonal.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.NotificationsActive
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.agendapersonal.notify.Notifier
import com.agendapersonal.sections.DigestStore
import com.agendapersonal.sections.Section
import com.agendapersonal.sections.HoroscopeData
import com.agendapersonal.sections.TopicSection
import com.agendapersonal.sections.WeatherData
import kotlinx.coroutines.launch

/** Pantalla completa de una sección: es a donde llevan las notificaciones. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SectionDetailScreen(section: Section, onBack: () -> Unit) {
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    val style = sectionStyle(section.id)
    var stored by remember(section.id) { mutableStateOf(DigestStore.load(ctx, section.id)) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(false) }
    var confirmDelete by remember { mutableStateOf(false) }

    fun refresh() {
        if (loading) return
        loading = true; error = false
        scope.launch {
            val d = DigestStore.refresh(ctx, section)
            loading = false
            if (d != null && d.ok) stored = DigestStore.load(ctx, section.id) else error = true
        }
    }
    // Si aún no hay datos guardados, se obtienen al abrir.
    LaunchedEffect(section.id) { if (stored == null) refresh() }

    if (confirmDelete && section is TopicSection) {
        AlertDialog(
            onDismissRequest = { confirmDelete = false },
            title = { Text("Eliminar sección") },
            text = { Text("Se dejará de seguir «${section.title}» y se cancelará su aviso diario.") },
            confirmButton = {
                TextButton(onClick = {
                    com.agendapersonal.sections.CustomTopics.remove(com.agendapersonal.data.Prefs(ctx), section.topic.id)
                    com.agendapersonal.notify.Scheduler.cancelSection(ctx, section.id)
                    confirmDelete = false; onBack()
                }) { Text("Eliminar", color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = { TextButton(onClick = { confirmDelete = false }) { Text("Cancelar") } },
        )
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconBadge(style.icon, style.color, emoji = style.emoji, size = 36.dp)
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text(section.title, style = MaterialTheme.typography.titleLarge)
                            stored?.let { Text("Actualizado ${DigestStore.relative(it.at)}", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                        }
                    }
                },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Rounded.ArrowBack, "Volver") } },
                actions = {
                    if (section is TopicSection) {
                        IconButton(onClick = { confirmDelete = true }) { Icon(Icons.Rounded.DeleteOutline, "Eliminar sección") }
                    }
                    FilledTonalIconButton(enabled = !loading, onClick = ::refresh) {
                        if (loading) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                        else Icon(Icons.Rounded.Refresh, "Actualizar")
                    }
                    Spacer(Modifier.width(8.dp))
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
            )
        },
    ) { padding ->
        Column(
            Modifier.padding(padding).fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp).padding(bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            if (error) Text(
                "No se pudo actualizar. Se muestran los últimos datos guardados.",
                style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error,
            )
            val s = stored
            if (s == null) {
                if (!loading) EmptyState(style.icon, "Sin datos todavía", "Pulsa actualizar para obtener la información.")
                else Box(Modifier.fillMaxWidth().padding(48.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            } else {
                val weather = WeatherData.fromJson(s.extra)
                val horoscope = HoroscopeData.fromJson(s.extra)
                when {
                    weather != null -> WeatherView(weather)
                    horoscope != null -> HoroscopeView(horoscope)
                    else -> DigestContent(s.body)
                }
                OutlinedButton(
                    onClick = { Notifier.postDigest(ctx, section, com.agendapersonal.sections.Digest(s.title, s.summary, s.body, s.preview, s.extra)) },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Icon(Icons.Rounded.NotificationsActive, null, Modifier.size(18.dp)); Spacer(Modifier.width(8.dp))
                    Text("Enviarme esta notificación ahora")
                }
            }
        }
    }
}
