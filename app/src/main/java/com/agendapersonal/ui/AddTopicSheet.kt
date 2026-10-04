package com.agendapersonal.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.agendapersonal.data.Prefs
import com.agendapersonal.notify.Scheduler
import com.agendapersonal.sections.CustomTopics
import com.agendapersonal.sections.TopicSection

private val emojiChoices = listOf("⭐", "⚽", "🎵", "🎬", "💻", "🍳", "✈️", "📚", "🌿", "🚗", "🎨", "🏡")

/** Hoja para crear una sección nueva de noticias sobre un tema. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AddTopicSheet(onClose: () -> Unit, onAdded: () -> Unit) {
    val ctx = LocalContext.current
    var title by remember { mutableStateOf("") }
    var terms by remember { mutableStateOf("") }
    var emoji by remember { mutableStateOf("⭐") }
    FormSheet(
        title = "Nueva sección", saveEnabled = title.isNotBlank(), onClose = onClose,
        onSave = {
            val topic = CustomTopics.add(Prefs(ctx), title, terms, emoji)
            Scheduler.scheduleSection(ctx, TopicSection(topic))
            onAdded(); onClose()
        },
    ) {
        OutlinedTextField(title, { title = it }, label = { Text("Nombre (p. ej. Ajedrez)") }, singleLine = true, shape = MaterialTheme.shapes.medium, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(
            terms, { terms = it }, label = { Text("Qué buscar (opcional)") }, shape = MaterialTheme.shapes.medium, modifier = Modifier.fillMaxWidth(),
            supportingText = { Text("Palabras clave, p. ej. «ajedrez OR Magnus Carlsen». Si lo dejas vacío se usa el nombre.") },
        )
        Text("Icono", style = MaterialTheme.typography.labelLarge)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            emojiChoices.forEach { FilterChip(selected = emoji == it, onClick = { emoji = it }, label = { Text(it) }) }
        }
    }
}
