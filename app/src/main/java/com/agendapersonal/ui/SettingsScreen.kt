package com.agendapersonal.ui

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.agendapersonal.data.Prefs
import com.agendapersonal.net.Http
import com.agendapersonal.notify.Scheduler
import kotlinx.coroutines.launch
import org.json.JSONObject

private data class Place(val name: String, val admin1: String, val admin2: String, val country: String, val lat: Double, val lon: Double)

@Composable
fun SettingsScreen() {
    val ctx = LocalContext.current
    val prefs = remember { Prefs(ctx) }
    val scope = rememberCoroutineScope()

    var query by remember { mutableStateOf("") }
    var results by remember { mutableStateOf<List<Place>>(emptyList()) }
    var status by remember { mutableStateOf<String?>(null) }
    var placeName by remember { mutableStateOf(prefs.placeName) }
    var province by remember { mutableStateOf(prefs.province) }
    var councils by remember { mutableStateOf(prefs.councils) }
    var terms by remember { mutableStateOf(prefs.watchTerms) }
    var feeds by remember { mutableStateOf(prefs.customFeeds) }

    fun search() {
        scope.launch {
            status = "Buscando…"
            runCatching {
                val json = JSONObject(Http.get("https://geocoding-api.open-meteo.com/v1/search?name=${Http.enc(query)}&count=6&language=es&format=json"))
                val arr = json.optJSONArray("results")
                (0 until (arr?.length() ?: 0)).map {
                    val o = arr!!.getJSONObject(it)
                    Place(o.getString("name"), o.optString("admin1"), o.optString("admin2"), o.optString("country"), o.getDouble("latitude"), o.getDouble("longitude"))
                }
            }.onSuccess { results = it; status = if (it.isEmpty()) "Sin resultados" else null }
                .onFailure { status = "No se pudo buscar. Revisa tu conexión." }
        }
    }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        ScreenHeader("Ajustes", "Personaliza tu información")

        Group(Icons.Rounded.LocationOn, MaterialTheme.colorScheme.primary, "Ubicación del tiempo", "Ahora: $placeName") {
            OutlinedTextField(
                query, { query = it }, label = { Text("Buscar municipio") }, singleLine = true,
                shape = MaterialTheme.shapes.medium, modifier = Modifier.fillMaxWidth(),
                trailingIcon = { IconButton(enabled = query.isNotBlank(), onClick = ::search) { Icon(Icons.Rounded.Search, "Buscar") } },
            )
            status?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            results.forEach { p ->
                Surface(
                    onClick = {
                        prefs.placeName = p.name; prefs.latitude = p.lat; prefs.longitude = p.lon
                        placeName = p.name
                        province = p.admin2.removePrefix("Provincia de ").ifBlank { p.admin1 }; prefs.province = province
                        // Añade el municipio a los ayuntamientos seguidos si no estaba (quita los antiguos a mano).
                        if (prefs.lines(councils).none { it.equals(p.name, ignoreCase = true) }) {
                            councils = (prefs.lines(councils) + p.name).joinToString("\n"); prefs.councils = councils
                        }
                        results = emptyList(); query = ""
                    },
                    shape = MaterialTheme.shapes.medium, color = MaterialTheme.colorScheme.surfaceContainer,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Rounded.Place, null, tint = MaterialTheme.colorScheme.primary)
                        Spacer(Modifier.width(10.dp))
                        Text(listOf(p.name, p.admin2, p.admin1, p.country).filter { it.isNotBlank() }.joinToString(", "), style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }

        Group(Icons.Rounded.Newspaper, LocalAccents.current.news, "Noticias locales", "Qué seguir además de las noticias generales") {
            OutlinedTextField(province, { province = it; prefs.province = it }, label = { Text("Provincia") }, singleLine = true, shape = MaterialTheme.shapes.medium, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(
                councils, { councils = it; prefs.councils = it }, label = { Text("Ayuntamientos a seguir") },
                supportingText = { Text("Uno por línea. Se busca «Ayuntamiento de …», su alcalde y el municipio.") },
                minLines = 2, shape = MaterialTheme.shapes.medium, modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                terms, { terms = it; prefs.watchTerms = it }, label = { Text("Nombres a vigilar") },
                supportingText = { Text("Uno por línea: alcalde, concejales, partidos, asociaciones…") },
                minLines = 2, shape = MaterialTheme.shapes.medium, modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                feeds, { feeds = it; prefs.customFeeds = it }, label = { Text("Feeds RSS propios") },
                supportingText = { Text("Uno por línea: periódicos locales o perfiles vía RSSHub/Nitter.") },
                minLines = 2, shape = MaterialTheme.shapes.medium, modifier = Modifier.fillMaxWidth(),
            )
        }

        Group(Icons.Rounded.NotificationsActive, LocalAccents.current.markets, "Avisos y batería", "Para que lleguen siempre a su hora") {
            val exact = Scheduler.canScheduleExact(ctx)
            StatusRow(exact, "Alarmas exactas", if (exact) "Concedido" else "Sin conceder: los avisos pueden retrasarse")
            if (!exact && Build.VERSION.SDK_INT >= 31) {
                Button(onClick = { ctx.startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${ctx.packageName}"))) }, modifier = Modifier.fillMaxWidth()) {
                    Text("Permitir alarmas exactas")
                }
            }
            OutlinedButton(onClick = { ctx.startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)) }, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Rounded.BatteryChargingFull, null, Modifier.size(18.dp)); Spacer(Modifier.width(8.dp))
                Text("Optimización de batería")
            }
            Text(
                "Si tu móvil (Xiaomi, Huawei, Samsung…) cierra la app en segundo plano, quita la optimización de batería para ella.",
                style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun StatusRow(ok: Boolean, title: String, text: String) {
    val accents = LocalAccents.current
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(if (ok) Icons.Rounded.CheckCircle else Icons.Rounded.Error, null, tint = if (ok) accents.success else accents.danger)
        Spacer(Modifier.width(10.dp))
        Column {
            Text(title, style = MaterialTheme.typography.titleSmall)
            Text(text, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun Group(icon: ImageVector, color: androidx.compose.ui.graphics.Color, title: String, subtitle: String, content: @Composable ColumnScope.() -> Unit) {
    AppCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconBadge(icon, color, size = 40.dp)
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(title, style = MaterialTheme.typography.titleMedium)
                    Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            content()
        }
    }
}
