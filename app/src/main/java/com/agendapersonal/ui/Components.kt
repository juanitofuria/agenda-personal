package com.agendapersonal.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class SectionStyle(val icon: ImageVector, val color: Color, val emoji: String? = null)

/** Icono y color de cada sección; las secciones nuevas usan uno por defecto. */
@Composable
fun sectionStyle(id: String): SectionStyle {
    val a = LocalAccents.current
    return when (id) {
        "weather" -> SectionStyle(Icons.Rounded.WbSunny, a.weather)
        "news" -> SectionStyle(Icons.Rounded.Newspaper, a.news)
        "agenda" -> SectionStyle(Icons.Rounded.Today, a.agenda)
        "markets" -> SectionStyle(Icons.Rounded.TrendingUp, a.markets)
        else -> com.agendapersonal.sections.SectionRegistry.byId(id)
            ?.let { SectionStyle(Icons.Rounded.AutoAwesome, Color(it.accent), it.emoji) }
            ?: SectionStyle(Icons.Rounded.AutoAwesome, MaterialTheme.colorScheme.primary)
    }
}

@Composable
fun IconBadge(icon: ImageVector, color: Color, size: Dp = 44.dp, modifier: Modifier = Modifier, emoji: String? = null) {
    Box(
        modifier.size(size).clip(RoundedCornerShape(size * 0.32f)).background(color.copy(alpha = 0.14f)),
        contentAlignment = Alignment.Center,
    ) {
        if (emoji != null) Text(emoji, fontSize = (size.value * 0.5f).sp)
        else Icon(icon, null, tint = color, modifier = Modifier.size(size * 0.54f))
    }
}

@Composable
fun ScreenHeader(title: String, subtitle: String? = null, trailing: (@Composable () -> Unit)? = null) {
    Row(Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.headlineMedium)
            if (subtitle != null) Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        trailing?.invoke()
    }
}

@Composable
fun EmptyState(icon: ImageVector, title: String, text: String, modifier: Modifier = Modifier) {
    Column(modifier.fillMaxWidth().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        IconBadge(icon, MaterialTheme.colorScheme.primary, size = 72.dp)
        Spacer(Modifier.height(16.dp))
        Text(title, style = MaterialTheme.typography.titleMedium, textAlign = TextAlign.Center)
        Spacer(Modifier.height(4.dp))
        Text(text, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
    }
}

@Composable
fun SmallChip(text: String, color: Color, icon: ImageVector? = null) {
    Row(
        Modifier.clip(CircleShape).background(color.copy(alpha = 0.14f)).padding(horizontal = 10.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) { Icon(icon, null, tint = color, modifier = Modifier.size(14.dp)); Spacer(Modifier.width(4.dp)) }
        Text(text, style = MaterialTheme.typography.labelMedium, color = color, fontWeight = FontWeight.SemiBold)
    }
}

/** Hoja inferior para formularios (nueva tarea / nueva cita). */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FormSheet(title: String, saveEnabled: Boolean, onClose: () -> Unit, onSave: () -> Unit, content: @Composable ColumnScope.() -> Unit) {
    ModalBottomSheet(
        onDismissRequest = onClose,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = MaterialTheme.colorScheme.surface,
    ) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).imePadding()
                .padding(horizontal = 24.dp).padding(bottom = 24.dp).navigationBarsPadding(),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text(title, style = MaterialTheme.typography.titleLarge)
            content()
            Button(onClick = onSave, enabled = saveEnabled, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text("Guardar") }
        }
    }
}

/** Tarjeta estándar de la app. */
@Composable
fun AppCard(modifier: Modifier = Modifier, onClick: (() -> Unit)? = null, content: @Composable ColumnScope.() -> Unit) {
    val colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    val elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    val border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
    if (onClick != null) Card(onClick, modifier, colors = colors, elevation = elevation, border = border, shape = MaterialTheme.shapes.large, content = content)
    else Card(modifier, colors = colors, elevation = elevation, border = border, shape = MaterialTheme.shapes.large, content = content)
}
