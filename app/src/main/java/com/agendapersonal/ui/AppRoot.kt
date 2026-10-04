package com.agendapersonal.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.agendapersonal.sections.SectionRegistry

enum class Tab(val label: String, val icon: ImageVector) {
    Home("Hoy", Icons.Rounded.Home),
    Tasks("Tareas", Icons.Rounded.CheckCircle),
    Appointments("Citas", Icons.Rounded.LocalHospital),
    Settings("Ajustes", Icons.Rounded.Settings),
}

/**
 * [target] llega desde las notificaciones: "section:<id>" abre solo esa sección, "tab:tasks"/"tab:appts" la pestaña,
 * y "edit_task:<id>"/"edit_appt:<id>" abre directamente la edición de ese evento.
 */
@Composable
fun AppRoot(target: MutableState<String?>, initialTab: Tab = Tab.Home) {
    var tab by remember(initialTab) { mutableStateOf(initialTab) }
    var detail by remember { mutableStateOf<String?>(null) }
    var editTask by remember { mutableStateOf<Long?>(null) }
    var editAppt by remember { mutableStateOf<Long?>(null) }

    LaunchedEffect(target.value) {
        val t = target.value ?: return@LaunchedEffect
        val kind = t.substringBefore(':')
        val arg = t.substringAfter(':', "")
        when (kind) {
            "section" -> if (SectionRegistry.byId(arg) != null) detail = arg
            "tab" -> { detail = null; tab = if (arg == "appts") Tab.Appointments else Tab.Tasks }
            "edit_task" -> { detail = null; tab = Tab.Tasks; editTask = arg.toLongOrNull() }
            "edit_appt" -> { detail = null; tab = Tab.Appointments; editAppt = arg.toLongOrNull() }
        }
        target.value = null
    }

    val open = detail?.let { SectionRegistry.byId(it) }
    if (open != null) {
        BackHandler { detail = null }
        SectionDetailScreen(open, onBack = { detail = null })
        return
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface, tonalElevation = 0.dp) {
                Tab.entries.forEach {
                    NavigationBarItem(
                        selected = tab == it,
                        onClick = { tab = it },
                        icon = { Icon(it.icon, it.label) },
                        label = { Text(it.label) },
                    )
                }
            }
        },
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            when (tab) {
                Tab.Home -> HomeScreen(onOpen = { detail = it })
                Tab.Tasks -> TasksScreen(editId = editTask, onEditConsumed = { editTask = null })
                Tab.Appointments -> AppointmentsScreen(editId = editAppt, onEditConsumed = { editAppt = null })
                Tab.Settings -> SettingsScreen()
            }
        }
    }
}
