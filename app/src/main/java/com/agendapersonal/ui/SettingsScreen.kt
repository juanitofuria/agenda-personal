package com.agendapersonal.ui

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
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

    Column(Modifier.padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("📍 Ubicación del tiempo", style = MaterialTheme.typography.titleMedium)
        Text("Actual: $placeName", style = MaterialTheme.typography.bodyMedium)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(query, { query = it }, label = { Text("Buscar municipio") }, singleLine = true, modifier = Modifier.weight(1f))
            Button(enabled = query.isNotBlank(), onClick = {
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
                        .onFailure { status = "Error de red" }
                }
            }) { Text("Buscar") }
        }
        status?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
        results.forEach { p ->
            OutlinedButton(onClick = {
                prefs.placeName = p.name; prefs.latitude = p.lat; prefs.longitude = p.lon
                placeName = p.name
                // Actualiza la provincia para las noticias locales (editable).
                province = p.admin2.ifBlank { p.admin1 }; prefs.province = province
                // Añade el municipio a los ayuntamientos seguidos si no estaba (quita los antiguos a mano).
                if (prefs.lines(councils).none { it.equals(p.name, ignoreCase = true) }) {
                    councils = (prefs.lines(councils) + p.name).joinToString("\n"); prefs.councils = councils
                }
                results = emptyList(); query = ""
            }, modifier = Modifier.fillMaxWidth()) {
                Text(listOf(p.name, p.admin2, p.admin1, p.country).filter { it.isNotBlank() }.joinToString(", "))
            }
        }

        HorizontalDivider()
        Text("🗞️ Noticias locales", style = MaterialTheme.typography.titleMedium)
        OutlinedTextField(province, { province = it; prefs.province = it }, label = { Text("Provincia") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(
            councils, { councils = it; prefs.councils = it },
            label = { Text("Ayuntamientos a seguir (uno por línea)") },
            supportingText = { Text("Se buscan noticias de «Ayuntamiento de …», su alcalde y el municipio") },
            minLines = 2, modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            terms, { terms = it; prefs.watchTerms = it },
            label = { Text("Nombres a vigilar (uno por línea)") },
            supportingText = { Text("Alcalde, concejales, partidos, asociaciones…") },
            minLines = 3, modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            feeds, { feeds = it; prefs.customFeeds = it },
            label = { Text("Feeds RSS propios (uno por línea)") },
            supportingText = { Text("Periódicos locales, o perfiles de redes vía RSSHub/Nitter") },
            minLines = 3, modifier = Modifier.fillMaxWidth(),
        )

        HorizontalDivider()
        Text("🔔 Permisos", style = MaterialTheme.typography.titleMedium)
        if (Build.VERSION.SDK_INT >= 31 && !Scheduler.canScheduleExact(ctx)) {
            Button(onClick = {
                ctx.startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${ctx.packageName}")))
            }) { Text("Permitir alarmas exactas") }
        } else Text("Alarmas exactas: concedido ✅", style = MaterialTheme.typography.bodyMedium)
        OutlinedButton(onClick = {
            ctx.startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
        }) { Text("Ajustes de optimización de batería") }
        Text(
            "Si tu móvil (Xiaomi, Huawei, Samsung…) cierra la app en segundo plano, desactiva la optimización de batería para ella.",
            style = MaterialTheme.typography.bodySmall,
        )
    }
}
