package com.agendapersonal.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val LightColors = lightColorScheme(
    primary = Color(0xFF3B5BDB), onPrimary = Color.White,
    primaryContainer = Color(0xFFDCE4FF), onPrimaryContainer = Color(0xFF0B1F6B),
    secondary = Color(0xFF0F9D8A), onSecondary = Color.White,
    secondaryContainer = Color(0xFFDCE4FF), onSecondaryContainer = Color(0xFF0B1F6B),
    tertiary = Color(0xFFF59E0B), onTertiary = Color.White,
    tertiaryContainer = Color(0xFFFFEDC7), onTertiaryContainer = Color(0xFF4A2F00),
    background = Color(0xFFF5F6FA), onBackground = Color(0xFF14171F),
    surface = Color(0xFFFFFFFF), onSurface = Color(0xFF14171F),
    surfaceVariant = Color(0xFFECEEF5), onSurfaceVariant = Color(0xFF5A6173),
    surfaceContainerLowest = Color.White, surfaceContainerLow = Color(0xFFF9FAFD),
    surfaceContainer = Color(0xFFF1F3F9), surfaceContainerHigh = Color(0xFFEBEDF5),
    outline = Color(0xFFC4C9D6), outlineVariant = Color(0xFFE2E5EE),
    error = Color(0xFFD92D4A), errorContainer = Color(0xFFFFE1E5), onErrorContainer = Color(0xFF5C0010),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF9DB0FF), onPrimary = Color(0xFF0B1F6B),
    primaryContainer = Color(0xFF24348C), onPrimaryContainer = Color(0xFFDCE4FF),
    secondary = Color(0xFF55D6C2), onSecondary = Color(0xFF00382F),
    secondaryContainer = Color(0xFF2E3F99), onSecondaryContainer = Color(0xFFDCE4FF),
    tertiary = Color(0xFFFFC857), onTertiary = Color(0xFF4A2F00),
    tertiaryContainer = Color(0xFF6B4500), onTertiaryContainer = Color(0xFFFFEDC7),
    background = Color(0xFF0E1117), onBackground = Color(0xFFE6E8EF),
    surface = Color(0xFF171B24), onSurface = Color(0xFFE6E8EF),
    surfaceVariant = Color(0xFF232836), onSurfaceVariant = Color(0xFFA3AABC),
    surfaceContainerLowest = Color(0xFF0B0E13), surfaceContainerLow = Color(0xFF131720),
    surfaceContainer = Color(0xFF1B202B), surfaceContainerHigh = Color(0xFF232836),
    outline = Color(0xFF454C5E), outlineVariant = Color(0xFF2A3040),
    error = Color(0xFFFF8A9B), errorContainer = Color(0xFF5C0010), onErrorContainer = Color(0xFFFFE1E5),
)

private val AppTypography = Typography().run {
    copy(
        headlineMedium = headlineMedium.copy(fontWeight = FontWeight.Bold, letterSpacing = (-0.5).sp),
        headlineSmall = headlineSmall.copy(fontWeight = FontWeight.Bold),
        titleLarge = titleLarge.copy(fontWeight = FontWeight.SemiBold),
        titleMedium = titleMedium.copy(fontWeight = FontWeight.SemiBold),
        titleSmall = titleSmall.copy(fontWeight = FontWeight.SemiBold),
        labelLarge = labelLarge.copy(fontWeight = FontWeight.SemiBold),
        bodyMedium = bodyMedium.copy(lineHeight = 21.sp),
    )
}

private val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(22.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

/** Colores de acento por tipo de contenido (se adaptan a claro/oscuro). */
data class Accents(val weather: Color, val news: Color, val agenda: Color, val markets: Color, val success: Color, val danger: Color)

private val LightAccents = Accents(
    weather = Color(0xFF0284C7), news = Color(0xFF7C3AED), agenda = Color(0xFF0F9D8A),
    markets = Color(0xFFD97706), success = Color(0xFF15803D), danger = Color(0xFFD92D4A),
)
private val DarkAccents = Accents(
    weather = Color(0xFF5CC8FF), news = Color(0xFFB794F6), agenda = Color(0xFF55D6C2),
    markets = Color(0xFFFFC857), success = Color(0xFF5FD38A), danger = Color(0xFFFF8A9B),
)
val LocalAccents = staticCompositionLocalOf { LightAccents }

@Composable
fun AgendaTheme(dark: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    androidx.compose.runtime.CompositionLocalProvider(LocalAccents provides if (dark) DarkAccents else LightAccents) {
        MaterialTheme(
            colorScheme = if (dark) DarkColors else LightColors,
            typography = AppTypography,
            shapes = AppShapes,
            content = content,
        )
    }
}
