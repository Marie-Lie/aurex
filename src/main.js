import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { authService } from './api/authService'

async function bootstrap() {
    await authService.initializeAuth()

    createApp(App)
        .use(router)
        .mount('#app')
}

bootstrap()