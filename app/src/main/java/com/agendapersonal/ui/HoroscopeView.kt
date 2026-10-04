package com.agendapersonal.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material.icons.rounded.StarBorder
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agendapersonal.sections.HoroscopeData

private fun categoryColor(category: String, a: Accents) = when (category) {
    "Salud" -> a.success; "Dinero" -> a.markets; "Trabajo" -> a.weather; else -> a.danger
}

@Composable
fun Stars(count: Int, color: Color, size: androidx.compose.ui.unit.Dp = 18.dp) {
    Row {
        repeat(5) { Icon(if (it < count) Icons.Rounded.Star else Icons.Rounded.StarBorder, null, tint = if (it < count) color else MaterialTheme.colorScheme.outline, modifier = Modifier.size(size)) }
    }
}

/** Horóscopo del día: cabecera del signo, una tarjeta por ámbito con estrellas y extras de la suerte. */
@Composable
fun HoroscopeView(data: HoroscopeData) {
    val accents = LocalAccents.current
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Column(
            Modifier.fillMaxWidth().clip(MaterialTheme.shapes.extraLarge)
                .background(Brush.linearGradient(listOf(Color(0xFFDB2777), Color(0xFF7C3AED)))).padding(22.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(data.sign.symbol, fontSize = 52.sp, color = Color.White)
                Spacer(Modifier.width(14.dp))
                Column {
                    Text(data.sign.label, style = MaterialTheme.typography.headlineMedium, color = Color.White)
                    Text("Signo de ${data.sign.element}", style = MaterialTheme.typography.bodyMedium, color = Color.White.copy(alpha = 0.85f))
                }
            }
            Text("“${data.advice}”", style = MaterialTheme.typography.bodyLarge, color = Color.White)
        }

        data.items.forEach { item ->
            val color = categoryColor(item.category, accents)
            AppCard(Modifier.fillMaxWidth()) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.Top) {
                    Text(item.emoji, fontSize = 28.sp, modifier = Modifier.width(44.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(item.category, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                            Stars(item.stars, color)
                        }
                        Text(item.text, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }

        AppCard(Modifier.fillMaxWidth()) {
            Row(Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Lucky("🍀", "Número", "${data.luckyNumber}", Modifier.weight(1f))
                Lucky("🎨", "Color", data.luckyColor, Modifier.weight(1f))
                Lucky("💞", "Afinidad", data.compatible.label, Modifier.weight(1f))
            }
        }
        Text(
            "Horóscopo de entretenimiento, generado en tu móvil a partir de tu signo y de la fecha. No es una predicción real.",
            style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun Lucky(emoji: String, title: String, value: String, modifier: Modifier = Modifier) {
    Column(modifier, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(emoji, fontSize = 24.sp)
        Text(title, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.titleSmall)
    }
}
