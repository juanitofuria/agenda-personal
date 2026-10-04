package com.agendapersonal.ui

import android.app.DatePickerDialog
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agendapersonal.net.Geocoding
import com.agendapersonal.net.Place
import com.agendapersonal.sections.InterestCatalog
import com.agendapersonal.sections.Onboarding
import com.agendapersonal.sections.OnboardingChoices
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.time.LocalDate
import java.util.Calendar
import java.util.Date
import java.util.Locale

private const val LAST_STEP = 5
private val ES = Locale("es", "ES")

/**
 * Configuración inicial: intereses, datos personales, zona y primeros planes.
 * Todo es opcional y se puede omitir en cualquier momento para entrar directamente en la app.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OnboardingScreen(initialStep: Int = 0, onFinished: () -> Unit) {
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    var step by remember(initialStep) { mutableIntStateOf(initialStep) }
    var visitedInterests by remember { mutableStateOf(false) }
    var saving by remember { mutableStateOf(false) }

    var builtIns by remember { mutableStateOf(setOf("weather", "news", "agenda", "markets")) }
    var topics by remember { mutableStateOf(setOf<String>()) }
    var extra by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var birth by remember { mutableStateOf<LocalDate?>(null) }
    var query by remember { mutableStateOf("") }
    var results by remember { mutableStateOf<List<Place>>(emptyList()) }
    var place by remember { mutableStateOf<Place?>(null) }
    var searchStatus by remember { mutableStateOf<String?>(null) }
    var taskTitle by remember { mutableStateOf("") }
    var apptTitle by remember { mutableStateOf("") }
    var apptAt by remember { mutableStateOf<Long?>(null) }

    LaunchedEffect(step) { if (step == 1) visitedInterests = true }

    fun choices() = OnboardingChoices(
        name, birth, place, builtIns, topics, extra.split(',', '\n').map { it.trim() }.filter { it.isNotEmpty() },
        interestsChosen = visitedInterests, taskTitle = taskTitle, apptTitle = apptTitle, apptAt = apptAt,
    )

    fun finish(skip: Boolean) {
        if (saving) return
        saving = true
        scope.launch {
            // Al omitir se conserva lo que ya se haya escrito, pero sin tocar las secciones por defecto.
            if (skip) Onboarding.skip(ctx, choices().copy(interestsChosen = false, builtIns = emptySet(), topics = emptySet(), extraTopics = emptyList()))
            else Onboarding.apply(ctx, choices())
            onFinished()
        }
    }

    Column(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).statusBarsPadding().navigationBarsPadding()) {
        // Progreso y omitir.
        Row(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            LinearProgressIndicator(progress = { step / LAST_STEP.toFloat() }, modifier = Modifier.weight(1f).height(6.dp).clip(MaterialTheme.shapes.small))
            TextButton(onClick = { finish(skip = true) }, enabled = !saving) { Text("Omitir") }
        }

        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 24.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            when (step) {
                0 -> {
                    Spacer(Modifier.height(24.dp))
                    Box(
                        Modifier.size(104.dp).clip(MaterialTheme.shapes.extraLarge).background(Brush.linearGradient(listOf(Color(0xFF3B5BDB), Color(0xFF7048E8)))).align(Alignment.CenterHorizontally),
                        contentAlignment = Alignment.Center,
                    ) { Text("🗓️", fontSize = 52.sp) }
                    Text("Bienvenido a Agenda Personal", style = MaterialTheme.typography.headlineMedium, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                    Text(
                        "Tu información de cada día en un solo sitio: el tiempo, las noticias que te importan, tus citas y tareas, y todo lo que quieras seguir.",
                        style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth(),
                    )
                    Text(
                        "Te haremos unas preguntas rápidas para personalizarla. Puedes omitirlas ahora y cambiarlo todo después en Ajustes.",
                        style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth(),
                    )
                }
                1 -> {
                    StepTitle("¿Qué te interesa?", "Elige lo que quieras ver cada día. Crearemos una sección para cada tema.")
                    Text("Secciones básicas", style = MaterialTheme.typography.titleSmall)
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        InterestCatalog.builtIns.forEach { (id, pair) ->
                            FilterChip(
                                selected = id in builtIns, onClick = { builtIns = if (id in builtIns) builtIns - id else builtIns + id },
                                label = { Text("${pair.first} ${pair.second}") },
                            )
                        }
                    }
                    Text("Aficiones y temas", style = MaterialTheme.typography.titleSmall, modifier = Modifier.padding(top = 6.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        InterestCatalog.topics.forEach {
                            FilterChip(
                                selected = it.label in topics, onClick = { topics = if (it.label in topics) topics - it.label else topics + it.label },
                                label = { Text("${it.emoji} ${it.label}") },
                            )
                        }
                    }
                    OutlinedTextField(
                        extra, { extra = it }, label = { Text("Otros intereses") }, modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium,
                        supportingText = { Text("Separados por comas: ajedrez, pesca, Real Madrid…") },
                    )
                }
                2 -> {
                    StepTitle("Sobre ti", "Solo se guarda en tu móvil. Opcional.")
                    OutlinedTextField(name, { name = it }, label = { Text("Tu nombre") }, singleLine = true, modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium)
                    OutlinedButton(
                        onClick = {
                            val c = Calendar.getInstance().apply { birth?.let { set(it.year, it.monthValue - 1, it.dayOfMonth) } ?: set(1990, 0, 1) }
                            DatePickerDialog(ctx, { _, y, m, d -> birth = LocalDate.of(y, m + 1, d) }, c.get(Calendar.YEAR), c.get(Calendar.MONTH), c.get(Calendar.DAY_OF_MONTH)).show()
                        },
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                    ) {
                        Icon(Icons.Rounded.Cake, null, Modifier.size(20.dp)); Spacer(Modifier.width(10.dp))
                        Text(birth?.let { SimpleDateFormat("d 'de' MMMM 'de' yyyy", ES).format(Date.from(it.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant())) } ?: "Fecha de nacimiento")
                    }
                    Text(
                        "La usamos para calcular tu signo y mostrarte el horóscopo diario (salud, dinero, trabajo y amor). Si no la indicas, esa sección no se activará.",
                        style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                3 -> {
                    StepTitle("¿Dónde vives?", "Para el tiempo y las noticias de tu zona. Opcional.")
                    OutlinedTextField(
                        query, { query = it }, label = { Text("Buscar municipio") }, singleLine = true, modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium,
                        trailingIcon = {
                            IconButton(enabled = query.isNotBlank(), onClick = {
                                scope.launch {
                                    searchStatus = "Buscando…"
                                    runCatching { Geocoding.search(query) }
                                        .onSuccess { results = it; searchStatus = if (it.isEmpty()) "Sin resultados" else null }
                                        .onFailure { searchStatus = "No se pudo buscar. Revisa tu conexión." }
                                }
                            }) { Icon(Icons.Rounded.Search, "Buscar") }
                        },
                    )
                    searchStatus?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                    results.forEach { p ->
                        Surface(onClick = { place = p; results = emptyList(); query = "" }, shape = MaterialTheme.shapes.medium, color = MaterialTheme.colorScheme.surfaceContainer, modifier = Modifier.fillMaxWidth()) {
                            Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Rounded.Place, null, tint = MaterialTheme.colorScheme.primary); Spacer(Modifier.width(10.dp))
                                Text(p.label, style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }
                    place?.let {
                        Row(
                            Modifier.fillMaxWidth().clip(MaterialTheme.shapes.medium).background(MaterialTheme.colorScheme.primaryContainer).padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Icon(Icons.Rounded.CheckCircle, null, tint = MaterialTheme.colorScheme.primary); Spacer(Modifier.width(10.dp))
                            Column { Text(it.name, style = MaterialTheme.typography.titleSmall); Text(it.label, style = MaterialTheme.typography.bodySmall) }
                        }
                    }
                }
                4 -> {
                    StepTitle("Tus planes", "Apunta algo que tengas pendiente o una cita. Opcional.")
                    OutlinedTextField(taskTitle, { taskTitle = it }, label = { Text("Una tarea pendiente") }, modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium)
                    Text("Una cita (médica u otra)", style = MaterialTheme.typography.titleSmall, modifier = Modifier.padding(top = 4.dp))
                    OutlinedTextField(apptTitle, { apptTitle = it }, label = { Text("Cita (p. ej. Cardiología)") }, modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium)
                    AssistChip(
                        onClick = { pickDateTime(ctx, apptAt) { apptAt = it } },
                        label = { Text(apptAt?.let { formatDateTime(it) } ?: "Elegir fecha y hora") },
                        leadingIcon = { Icon(Icons.Rounded.CalendarMonth, null, Modifier.size(18.dp)) },
                    )
                }
                else -> {
                    StepTitle("¡Todo listo!", "Esto es lo que vamos a preparar:")
                    val c = choices()
                    val lines = buildList {
                        if (c.name.isNotBlank()) add("👋 Hola, ${c.name.trim()}")
                        place?.let { add("📍 Tiempo y noticias de ${it.name}") }
                        c.birth?.let { add("🔮 Horóscopo de ${com.agendapersonal.sections.Sign.of(it).label}") }
                        val shown = InterestCatalog.builtIns.filter { it.first in builtIns }.map { it.second.second }
                        if (shown.isNotEmpty()) add("📋 " + shown.joinToString(", "))
                        val more = topics.toList() + c.extraTopics
                        if (more.isNotEmpty()) add("⭐ " + more.joinToString(", "))
                        if (c.taskTitle.isNotBlank()) add("✅ Tarea: ${c.taskTitle}")
                        if (c.apptTitle.isNotBlank() && c.apptAt != null) add("🩺 Cita: ${c.apptTitle} · ${formatDateTime(c.apptAt)}")
                    }
                    lines.forEach {
                        Row(Modifier.fillMaxWidth().clip(MaterialTheme.shapes.medium).background(MaterialTheme.colorScheme.surface).padding(14.dp)) { Text(it, style = MaterialTheme.typography.bodyMedium) }
                    }
                    Text("Cada sección te avisará a su hora; podrás cambiar horas y temas cuando quieras.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }

        Row(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            if (step > 0) OutlinedButton(onClick = { step-- }, modifier = Modifier.height(52.dp), enabled = !saving) { Text("Atrás") }
            Button(
                onClick = { if (step < LAST_STEP) step++ else finish(skip = false) },
                modifier = Modifier.weight(1f).height(52.dp), enabled = !saving,
            ) { Text(when (step) { 0 -> "Empezar"; LAST_STEP -> "Entrar en la app"; else -> "Siguiente" }) }
        }
    }
}

@Composable
private fun StepTitle(title: String, subtitle: String) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(title, style = MaterialTheme.typography.headlineMedium)
        Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
