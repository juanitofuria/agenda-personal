package com.agendapersonal.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

private val hourLine = Regex("""^(\d{2}:\d{2})\s+(.*)$""")
private val quoteLine = Regex("""^(🟢|🔴|⚪)\s+(.+?)\s{2}(\S+)\s{2}\(([^)]+)\)(?:\s+· (.+))?$""")

/** Pinta el texto de un resumen como tarjetas: una por bloque, con titulares, viñetas, horas y cotizaciones. */
@Composable
fun DigestContent(body: String) {
    val blocks = body.split("\n\n").map { it.trim() }.filter { it.isNotEmpty() }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        blocks.forEach { block -> BlockCard(block.lines()) }
    }
}

@Composable
private fun BlockCard(lines: List<String>) {
    val isData = lines.all { hourLine.matches(it) || quoteLine.matches(it) }
    val header = lines.first().takeIf { !isData && !it.startsWith("•") && !it.startsWith("⚠️") }
    val rest = if (header != null) lines.drop(1) else lines
    AppCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (header != null) Text(header, style = MaterialTheme.typography.titleSmall)
            rest.forEach { Line(it) }
        }
    }
}

@Composable
private fun Line(text: String) {
    val accents = LocalAccents.current
    hourLine.matchEntire(text)?.let { m ->
        Row(verticalAlignment = Alignment.Top) {
            Text(m.groupValues[1], style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary, modifier = Modifier.width(52.dp))
            Text(m.groupValues[2], style = MaterialTheme.typography.bodyMedium)
        }
        return
    }
    quoteLine.matchEntire(text)?.let { m ->
        val color = when (m.groupValues[1]) { "🟢" -> accents.success; "🔴" -> accents.danger; else -> MaterialTheme.colorScheme.onSurfaceVariant }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(m.groupValues[2], style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                if (m.groupValues[5].isNotEmpty()) Text(m.groupValues[5], style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text(m.groupValues[3], style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(end = 10.dp))
            SmallChip(m.groupValues[4], color)
        }
        return
    }
    if (text.startsWith("• ")) {
        Row(verticalAlignment = Alignment.Top) {
            Text("•", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold, modifier = Modifier.width(16.dp))
            Text(text.removePrefix("• "), style = MaterialTheme.typography.bodyMedium)
        }
    } else if (text.startsWith("⚠️")) {
        Text(text, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
    } else {
        Text(text, style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Start)
    }
}
