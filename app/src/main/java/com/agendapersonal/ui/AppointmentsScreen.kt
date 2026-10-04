package com.agendapersonal.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.agendapersonal.data.AppDb
import com.agendapersonal.data.Appointment
import com.agendapersonal.notify.Scheduler
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import java.util.Date
import java.util.Locale

private val reminderOptions = listOf(30 to "30 min", 60 to "1 h", 180 to "3 h", 1440 to "1 día")
private val ES = Locale("es", "ES")

@Composable
fun AppointmentsScreen() {
    val ctx = LocalContext.current
    val dao = remember { AppDb.get(ctx).appointments() }
    val all by dao.observeAll().collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()
    var adding by remember { mutableStateOf(false) }
    val now = System.currentTimeMillis()
    val upcoming = all.filter { it.at >= now }
    val past = all.filter { it.at < now }.reversed()

    Box(Modifier.fillMaxSize()) {
        LazyColumn(
            contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 96.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                ScreenHeader("Citas médicas", if (upcoming.isEmpty()) "Sin citas próximas" else "${upcoming.size} próxima${if (upcoming.size == 1) "" else "s"}")
            }
            if (all.isEmpty()) item {
                EmptyState(Icons.Rounded.EventAvailable, "Sin citas", "Guarda tus citas médicas y recibirás un aviso con la antelación que elijas.", Modifier.padding(top = 48.dp))
            }
            items(upcoming, key = { it.id }) { AppointmentCard(it, past = false) { scope.launch { Scheduler.cancelAppointment(ctx, it); dao.delete(it) } } }
            if (past.isNotEmpty()) {
                item { Text("Pasadas", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 10.dp)) }
                items(past, key = { it.id }) { AppointmentCard(it, past = true) { scope.launch { Scheduler.cancelAppointment(ctx, it); dao.delete(it) } } }
            }
        }
        ExtendedFloatingActionButton(
            onClick = { adding = true },
            icon = { Icon(Icons.Rounded.Add, null) },
            text = { Text("Nueva cita") },
            modifier = Modifier.align(Alignment.BottomEnd).padding(20.dp),
            containerColor = MaterialTheme.colorScheme.primary,
            contentColor = MaterialTheme.colorScheme.onPrimary,
        )
    }

    if (adding) {
        var title by remember { mutableStateOf("") }
        var place by remember { mutableStateOf("") }
        var at by remember { mutableStateOf<Long?>(null) }
        var before by remember { mutableIntStateOf(60) }
        FormSheet(
            title = "Nueva cita médica", saveEnabled = title.isNotBlank() && at != null, onClose = { adding = false },
            onSave = {
                scope.launch {
                    val a = Appointment(title = title.trim(), place = place.trim(), at = at!!, remindMinutesBefore = before)
                    Scheduler.scheduleAppointment(ctx, a.copy(id = dao.insert(a)))
                }
                adding = false
            },
        ) {
            OutlinedTextField(title, { title = it }, label = { Text("Cita (p. ej. Cardiología)") }, modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium)
            OutlinedTextField(place, { place = it }, label = { Text("Lugar (opcional)") }, modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium)
            AssistChip(
                onClick = { pickDateTime(ctx, at) { at = it } },
                label = { Text(at?.let { formatDateTime(it) } ?: "Elegir fecha y hora") },
                leadingIcon = { Icon(Icons.Rounded.CalendarMonth, null, Modifier.size(18.dp)) },
            )
            Text("Avisarme con antelación", style = MaterialTheme.typography.labelLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                reminderOptions.forEach { (min, label) ->
                    FilterChip(selected = before == min, onClick = { before = min }, label = { Text(label) })
                }
            }
        }
    }
}

@Composable
private fun AppointmentCard(a: Appointment, past: Boolean, onDelete: () -> Unit) {
    val accents = LocalAccents.current
    val color = if (past) MaterialTheme.colorScheme.onSurfaceVariant else accents.agenda
    val date = java.time.Instant.ofEpochMilli(a.at).atZone(ZoneId.systemDefault()).toLocalDate()
    val days = ChronoUnit.DAYS.between(LocalDate.now(), date)
    val tag = when {
        past -> null
        days == 0L -> "Hoy"
        days == 1L -> "Mañana"
        days < 7 -> "En $days días"
        else -> null
    }
    AppCard(Modifier.fillMaxWidth().alpha(if (past) 0.65f else 1f)) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(
                Modifier.size(width = 58.dp, height = 62.dp).clip(RoundedCornerShape(16.dp)).background(color.copy(alpha = 0.14f)),
                horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center,
            ) {
                Text(SimpleDateFormat("MMM", ES).format(Date(a.at)).uppercase().removeSuffix("."), style = MaterialTheme.typography.labelSmall, color = color)
                Text(SimpleDateFormat("d", ES).format(Date(a.at)), style = MaterialTheme.typography.headlineSmall, color = color, textAlign = TextAlign.Center)
            }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(a.title, style = MaterialTheme.typography.titleMedium)
                Text(
                    SimpleDateFormat("EEEE · HH:mm", ES).format(Date(a.at)).replaceFirstChar { it.uppercase() },
                    style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                if (a.place.isNotBlank()) Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.LocationOn, null, Modifier.size(14.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.width(3.dp))
                    Text(a.place, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 2.dp)) {
                    tag?.let { SmallChip(it, color) }
                    if (!past) SmallChip("Aviso ${reminderOptions.firstOrNull { it.first == a.remindMinutesBefore }?.second ?: "${a.remindMinutesBefore} min"} antes", MaterialTheme.colorScheme.primary, Icons.Rounded.NotificationsActive)
                }
            }
            IconButton(onClick = onDelete) { Icon(Icons.Rounded.DeleteOutline, "Borrar", tint = MaterialTheme.colorScheme.onSurfaceVariant) }
        }
    }
}
