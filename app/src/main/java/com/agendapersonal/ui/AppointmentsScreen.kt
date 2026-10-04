package com.agendapersonal.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.agendapersonal.data.AppDb
import com.agendapersonal.data.Appointment
import com.agendapersonal.notify.Scheduler
import kotlinx.coroutines.launch

private val reminderOptions = listOf(30 to "30 min", 60 to "1 h", 180 to "3 h", 1440 to "1 día")

@Composable
fun AppointmentsScreen() {
    val ctx = LocalContext.current
    val dao = remember { AppDb.get(ctx).appointments() }
    val items by dao.observeAll().collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()
    var adding by remember { mutableStateOf(false) }
    val now = System.currentTimeMillis()

    Box(Modifier.fillMaxSize()) {
        if (items.isEmpty()) Text("No hay citas. Pulsa + para añadir una.", Modifier.align(Alignment.Center))
        LazyColumn(contentPadding = PaddingValues(16.dp, 8.dp, 16.dp, 88.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(items, key = { it.id }) { a ->
                Card(Modifier.fillMaxWidth()) {
                    Row(Modifier.padding(start = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f).padding(vertical = 12.dp)) {
                            Text(a.title, style = MaterialTheme.typography.titleMedium)
                            Text(
                                formatDateTime(a.at) + if (a.at < now) " (pasada)" else "",
                                style = MaterialTheme.typography.bodyMedium,
                            )
                            if (a.place.isNotBlank()) Text("📍 ${a.place}", style = MaterialTheme.typography.bodySmall)
                            Text("Aviso ${reminderOptions.firstOrNull { it.first == a.remindMinutesBefore }?.second ?: "${a.remindMinutesBefore} min"} antes", style = MaterialTheme.typography.bodySmall)
                        }
                        IconButton(onClick = { scope.launch { Scheduler.cancelAppointment(ctx, a); dao.delete(a) } }) {
                            Icon(Icons.Default.Delete, "Borrar")
                        }
                    }
                }
            }
        }
        FloatingActionButton(
            onClick = { adding = true },
            modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp),
        ) { Icon(Icons.Default.Add, "Añadir cita") }
    }

    if (adding) {
        var title by remember { mutableStateOf("") }
        var place by remember { mutableStateOf("") }
        var at by remember { mutableStateOf<Long?>(null) }
        var before by remember { mutableIntStateOf(60) }
        AlertDialog(
            onDismissRequest = { adding = false },
            title = { Text("Nueva cita médica") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(title, { title = it }, label = { Text("Cita (p. ej. Cardiología)") })
                    OutlinedTextField(place, { place = it }, label = { Text("Lugar (opcional)") })
                    OutlinedButton(onClick = { pickDateTime(ctx, at) { at = it } }) {
                        Text(at?.let { "📅 ${formatDateTime(it)}" } ?: "Elegir fecha y hora")
                    }
                    Text("Avisar con antelación:", style = MaterialTheme.typography.bodySmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        reminderOptions.forEach { (min, label) ->
                            FilterChip(selected = before == min, onClick = { before = min }, label = { Text(label) })
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(enabled = title.isNotBlank() && at != null, onClick = {
                    scope.launch {
                        val a = Appointment(title = title.trim(), place = place.trim(), at = at!!, remindMinutesBefore = before)
                        val id = dao.insert(a)
                        Scheduler.scheduleAppointment(ctx, a.copy(id = id))
                    }
                    adding = false
                }) { Text("Guardar") }
            },
            dismissButton = { TextButton(onClick = { adding = false }) { Text("Cancelar") } },
        )
    }
}
