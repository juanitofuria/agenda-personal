package com.agendapersonal.ui

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Context
import androidx.compose.foundation.clickable
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

fun formatDateTime(ms: Long): String = dateTimeFmt.format(Date(ms)).replaceFirstChar { it.uppercase() }

@Composable
fun TasksScreen(editId: Long? = null, onEditConsumed: () -> Unit = {}) {
    val ctx = LocalContext.current
    val dao = remember { AppDb.get(ctx).tasks() }
    val tasks by dao.observeAll().collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()
    var adding by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<Task?>(null) }
    // Llega desde el botón "Modificar" de una notificación.
    LaunchedEffect(editId) {
        if (editId != null) { editing = dao.get(editId); onEditConsumed() }
    }
    val pending = tasks.filter { !it.done }
    val done = tasks.filter { it.done }

    Box(Modifier.fillMaxSize()) {
        LazyColumn(
            contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 96.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                ScreenHeader(
                    "Tareas",
                    if (tasks.isEmpty()) "Todo en orden" else "${pending.size} pendiente${if (pending.size == 1) "" else "s"} · ${done.size} completada${if (done.size == 1) "" else "s"}",
                )
            }
            if (tasks.isEmpty()) item {
                EmptyState(Icons.Rounded.TaskAlt, "Sin tareas", "Añade lo que tengas pendiente y, si quieres, un aviso a una hora concreta.", Modifier.padding(top = 48.dp))
            }
            items(pending, key = { it.id }) { TaskRow(it, dao, ctx) { t -> editing = t } }
            if (done.isNotEmpty()) {
                item { Text("Completadas", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 10.dp)) }
                items(done, key = { it.id }) { TaskRow(it, dao, ctx) { t -> editing = t } }
            }
        }
        ExtendedFloatingActionButton(
            onClick = { adding = true },
            icon = { Icon(Icons.Rounded.Add, null) },
            text = { Text("Nueva tarea") },
            modifier = Modifier.align(Alignment.BottomEnd).padding(20.dp),
            containerColor = MaterialTheme.colorScheme.primary,
            contentColor = MaterialTheme.colorScheme.onPrimary,
        )
    }

    if (adding || editing != null) {
        val initial = editing
        var title by remember(initial) { mutableStateOf(initial?.title ?: "") }
        var remindAt by remember(initial) { mutableStateOf(initial?.remindAt) }
        val close = { adding = false; editing = null }
        FormSheet(
            title = if (initial == null) "Nueva tarea" else "Modificar tarea", saveEnabled = title.isNotBlank(), onClose = close,
            onSave = {
                scope.launch {
                    if (initial == null) {
                        val t = Task(title = title.trim(), remindAt = remindAt)
                        Scheduler.scheduleTask(ctx, t.copy(id = dao.insert(t)))
                    } else {
                        val t = initial.copy(title = title.trim(), remindAt = remindAt)
                        dao.update(t); Scheduler.scheduleTask(ctx, t)
                    }
                }
                close()
            },
        ) {
            OutlinedTextField(title, { title = it }, label = { Text("¿Qué tienes que hacer?") }, modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AssistChip(
                    onClick = { pickDateTime(ctx, remindAt) { remindAt = it } },
                    label = { Text(remindAt?.let { formatDateTime(it) } ?: "Añadir aviso") },
                    leadingIcon = { Icon(Icons.Rounded.NotificationsActive, null, Modifier.size(18.dp)) },
                )
                if (remindAt != null) TextButton(onClick = { remindAt = null }) { Text("Quitar") }
            }
            if (initial != null) TextButton(
                onClick = { scope.launch { Scheduler.cancelTask(ctx, initial); dao.delete(initial) }; close() },
                colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error),
            ) { Icon(Icons.Rounded.DeleteOutline, null, Modifier.size(18.dp)); Spacer(Modifier.width(6.dp)); Text("Eliminar tarea") }
        }
    }
}

@Composable
private fun TaskRow(task: Task, dao: com.agendapersonal.data.TaskDao, ctx: Context, onEdit: (Task) -> Unit) {
    val scope = rememberCoroutineScope()
    val accents = LocalAccents.current
    val overdue = !task.done && task.remindAt != null && task.remindAt < System.currentTimeMillis()
    AppCard(Modifier.fillMaxWidth().alpha(if (task.done) 0.6f else 1f), onClick = { onEdit(task) }) {
        Row(Modifier.padding(start = 6.dp, end = 4.dp, top = 6.dp, bottom = 6.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = {
                scope.launch {
                    val updated = task.copy(done = !task.done)
                    dao.update(updated)
                    Scheduler.scheduleTask(ctx, updated)
                }
            }) {
                Icon(
                    if (task.done) Icons.Rounded.CheckCircle else Icons.Rounded.RadioButtonUnchecked, "Completar",
                    tint = if (task.done) accents.success else MaterialTheme.colorScheme.outline,
                )
            }
            Column(Modifier.weight(1f).padding(vertical = 6.dp)) {
                Text(task.title, style = MaterialTheme.typography.bodyLarge, textDecoration = if (task.done) TextDecoration.LineThrough else null)
                task.remindAt?.let {
                    Spacer(Modifier.height(4.dp))
                    SmallChip(formatDateTime(it), if (overdue) accents.danger else MaterialTheme.colorScheme.primary, Icons.Rounded.Schedule)
                }
            }
            IconButton(onClick = { scope.launch { Scheduler.cancelTask(ctx, task); dao.delete(task) } }) {
                Icon(Icons.Rounded.DeleteOutline, "Borrar", tint = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}
