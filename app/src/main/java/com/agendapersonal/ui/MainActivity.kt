package com.agendapersonal.ui

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.mutableStateOf
import com.agendapersonal.notify.Notifier

class MainActivity : ComponentActivity() {
    private val openSection = mutableStateOf<String?>(null)

    private val askNotifications =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        openSection.value = intent?.getStringExtra(Notifier.EXTRA_SECTION)
        if (Build.VERSION.SDK_INT >= 33) askNotifications.launch(Manifest.permission.POST_NOTIFICATIONS)
        setContent { AgendaTheme { AppRoot(openSection) } }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        openSection.value = intent.getStringExtra(Notifier.EXTRA_SECTION)
    }
}
