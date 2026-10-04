package com.agendapersonal.ui

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Context
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
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import com.agendapersonal.data.AppDb
import com.agendapersonal.data.Task
import com.agendapersonal.notify.Scheduler
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

private val dateTimeFmt = SimpleDateFormat("EEE d MMM, HH:mm", Locale("es", "ES"))

/** Selector de fecha y luego hora con los diálogos del sistema. */
fun pickDateTime(ctx: Context, initial: Long?, onPicked: (Long) -> Unit) {
    val c = Calendar.getInstance().apply { timeInMillis = initial ?: (System.currentTimeMillis() + 3_600_000) }
    DatePickerDialog(ctx, { _, y, mo, d ->
        TimePickerDialog(ctx, { _, h, mi ->
            val r = Calendar.getInstance().apply { set(y, mo, d, h, mi, 0); set(Calendar.MILLISECOND, 0) }
            onPicked(r.timeInMillis)
        }, c.get(Calendar.HOUR_OF_DAY), c.get(Calendar.MINUTE), true).show()
    }, c.get(Calendar.YEAR), c.get(Calendar.MONTH), c.get(Calendar.DAY_OF_MONTH)).show()
}

fun formatDateTime(ms: Long): String = dateTimeFmt.format(Date(ms))

@Composable
fun TasksScreen() {
    val ctx = LocalContext.current
    val dao = remember { AppDb.get(ctx).tasks() }
    val tasks by dao.observeAll().collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()
    var adding by remember { mutableStateOf(false) }

    Box(Modifier.fillMaxSize()) {
        if (tasks.isEmpty()) {
            Text("No hay tareas. Pulsa + para añadir una.", Modifier.align(Alignment.Center))
        }
        LazyColumn(contentPadding = PaddingValues(bottom = 88.dp)) {
            items(tasks, key = { it.id }) { task ->
                Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = task.done, onCheckedChange = { checked ->
                        scope.launch {
                            val updated = task.copy(done = checked)
                            dao.update(updated)
                            Scheduler.scheduleTask(ctx, updated)
                        }
                    })
                    Column(Modifier.weight(1f)) {
                        Text(
                            task.title,
                            textDecoration = if (task.done) TextDecoration.LineThrough else null,
                        )
                        task.remindAt?.let { Text("⏰ ${formatDateTime(it)}", style = MaterialTheme.typography.bodySmall) }
                    }
                    IconButton(onClick = {
                        scope.launch { Scheduler.cancelTask(ctx, task); dao.delete(task) }
                    }) { Icon(Icons.Default.Delete, "Borrar") }
                }
            }
        }
        FloatingActionButton(
            onClick = { adding = true },
            modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp),
        ) { Icon(Icons.Default.Add, "Añadir tarea") }
    }

    if (adding) {
        var title by remember { mutableStateOf("") }
        var remindAt by remember { mutableStateOf<Long?>(null) }
        AlertDialog(
            onDismissRequest = { adding = false },
            title = { Text("Nueva tarea") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(title, { title = it }, label = { Text("Tarea") })
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        OutlinedButton(onClick = { pickDateTime(ctx, remindAt) { remindAt = it } }) {
                            Text(remindAt?.let { "⏰ ${formatDateTime(it)}" } ?: "Añadir aviso")
                        }
                        if (remindAt != null) TextButton(onClick = { remindAt = null }) { Text("Quitar") }
                    }
                }
            },
            confirmButton = {
                TextButton(enabled = title.isNotBlank(), onClick = {
                    scope.launch {
                        val t = Task(title = title.trim(), remindAt = remindAt)
                        val id = dao.insert(t)
                        Scheduler.scheduleTask(ctx, t.copy(id = id))
                    }
                    adding = false
                }) { Text("Guardar") }
            },
            dismissButton = { TextButton(onClick = { adding = false }) { Text("Cancelar") } },
        )
    }
}
