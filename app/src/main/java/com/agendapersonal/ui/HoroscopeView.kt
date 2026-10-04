package com.agendapersonal.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.agendapersonal.sections.HoroscopeData
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

private fun dayLabel(iso: String) = runCatching {
    LocalDate.parse(iso).format(DateTimeFormatter.ofPattern("d 'de' MMMM", Locale("es", "ES")))
}.getOrDefault(iso)

/** Horóscopo del día tal y como lo publica el servidor: texto del signo y datos de la suerte de la fuente. */
@Composable
fun HoroscopeView(data: HoroscopeData) {
    val accents = LocalAccents.current
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Column(
            Modifier.fillMaxWidth().clip(MaterialTheme.shapes.extraLarge)
                .background(Brush.linearGradient(listOf(Color(0xFFDB2777), Color(0xFF7C3AED)))).padding(22.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(data.sign.symbol, fontSize = 52.sp, color = Color.White)
                Spacer(Modifier.width(14.dp))
                Column {
                    Text(data.sign.label, style = MaterialTheme.typography.headlineMedium, color = Color.White)
                    Text("Signo de ${data.sign.element}", style = MaterialTheme.typography.bodyMedium, color = Color.White.copy(alpha = 0.85f))
                }
            }
            Text(
                if (data.stale) "Horóscopo del ${dayLabel(data.date)}" else "Horóscopo de hoy, ${dayLabel(data.date)}",
                style = MaterialTheme.typography.labelLarge, color = Color.White.copy(alpha = 0.9f), modifier = Modifier.padding(top = 6.dp),
            )
        }

        if (data.stale) {
            Row(
                Modifier.fillMaxWidth().clip(MaterialTheme.shapes.large).background(accents.markets.copy(alpha = 0.14f)).padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("⚠️", fontSize = 20.sp); Spacer(Modifier.width(10.dp))
                Text("Aún no se ha publicado el de hoy: se muestra el último disponible.", style = MaterialTheme.typography.bodySmall)
            }
        }

        AppCard(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(data.text, style = MaterialTheme.typography.bodyLarge)
                if (data.sourceUrl.isNotBlank()) {
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    // La API de origen exige mostrar la fuente junto al texto.
                    val uri = LocalUriHandler.current
                    TextButton(onClick = { runCatching { uri.openUri(data.sourceUrl) } }, contentPadding = PaddingValues(0.dp)) {
                        Text("Fuente: ${data.source.ifBlank { data.sourceUrl }}", style = MaterialTheme.typography.labelLarge)
                        Spacer(Modifier.width(4.dp))
                        Icon(Icons.AutoMirrored.Rounded.OpenInNew, null, Modifier.size(16.dp))
                    }
                }
            }
        }

        Text(
            "Texto publicado por " + (data.source.ifBlank { "el editor original" }) +
                ", obtenido a través de horoscopefree; los derechos pertenecen a su editor. Contenido de carácter informativo y de entretenimiento.",
            style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
