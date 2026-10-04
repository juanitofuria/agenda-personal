package com.agendapersonal.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

enum class Tab(val label: String, val icon: ImageVector) {
    Home("Hoy", Icons.Rounded.Home),
    Tasks("Tareas", Icons.Rounded.CheckCircle),
    Appointments("Citas", Icons.Rounded.LocalHospital),
    Settings("Ajustes", Icons.Rounded.Settings),
}

@Composable
fun AppRoot(openSection: MutableState<String?>, initialTab: Tab = Tab.Home) {
    var tab by remember(initialTab) { mutableStateOf(initialTab) }

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
                Tab.Home -> HomeScreen(openSection)
                Tab.Tasks -> TasksScreen()
                Tab.Appointments -> AppointmentsScreen()
                Tab.Settings -> SettingsScreen()
            }
        }
    }
}
