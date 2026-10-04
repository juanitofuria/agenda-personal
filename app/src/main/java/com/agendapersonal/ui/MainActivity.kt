package com.agendapersonal.ui

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.agendapersonal.data.Prefs
import com.agendapersonal.notify.Notifier

class MainActivity : ComponentActivity() {
    private val target = mutableStateOf<String?>(null)

    private val askNotifications =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        target.value = intent?.getStringExtra(Notifier.EXTRA_TARGET)
        if (Build.VERSION.SDK_INT >= 33) askNotifications.launch(Manifest.permission.POST_NOTIFICATIONS)
        setContent {
            AgendaTheme {
                var onboarded by remember { mutableStateOf(Prefs(this).onboarded) }
                if (!onboarded) OnboardingScreen(onFinished = { onboarded = true })
                else AppRoot(target, onRerunOnboarding = { Prefs(this).onboarded = false; onboarded = false })
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        target.value = intent.getStringExtra(Notifier.EXTRA_TARGET)
    }
}
