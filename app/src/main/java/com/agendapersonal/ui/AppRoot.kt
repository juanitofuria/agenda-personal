package com.agendapersonal.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.agendapersonal.data.Prefs
import com.agendapersonal.sections.SectionRegistry

private enum class Tab(val label: String) { Digests("Resúmenes"), Tasks("Tareas"), Appointments("Citas"), Settings("Ajustes") }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppRoot(openSection: MutableState<String?>) {
    var tab by remember { mutableStateOf(Tab.Digests) }
    val ctx = LocalContext.current

    // Al tocar una notificación se muestra el último contenido de esa sección.
    openSection.value?.let { id ->
        val section = SectionRegistry.byId(id)
        val text = Prefs(ctx).lastDigest(id)
        if (section != null && text != null) {
            TextDialog(section.title, text) { openSection.value = null }
        } else LaunchedEffect(id) { openSection.value = null }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Agenda Personal") }) },
        bottomBar = {
            NavigationBar {
                Tab.entries.forEach {
                    NavigationBarItem(
                        selected = tab == it,
                        onClick = { tab = it },
                        icon = {
                            Icon(
                                when (it) {
                                    Tab.Digests -> Icons.Default.Notifications
                                    Tab.Tasks -> Icons.Default.CheckCircle
                                    Tab.Appointments -> Icons.Default.LocalHospital
                                    Tab.Settings -> Icons.Default.Settings
                                }, null,
                            )
                        },
                        label = { Text(it.label) },
                    )
                }
            }
        },
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            when (tab) {
                Tab.Digests -> DigestsScreen()
                Tab.Tasks -> TasksScreen()
                Tab.Appointments -> AppointmentsScreen()
                Tab.Settings -> SettingsScreen()
            }
        }
    }
}

@Composable
fun TextDialog(title: String, text: String, onClose: () -> Unit) {
    AlertDialog(
        onDismissRequest = onClose,
        title = { Text(title) },
        text = { Column(Modifier.verticalScroll(rememberScrollState())) { Text(text) } },
        confirmButton = { TextButton(onClick = onClose) { Text("Cerrar") } },
    )
}
