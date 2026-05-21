<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { isApiEnabled } from '../api/client'

definePage({
  meta: { layout: false }
})

const router = useRouter()
const route = useRoute()
const { login } = useAuth()

const formLogin = ref('')
const formPassword = ref('')
const error = ref('')
const pending = ref(false)

async function onSubmit() {
  error.value = ''
  pending.value = true
  try {
    await login(formLogin.value.trim(), formPassword.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/schedule'
    await router.replace(redirect)
  }
  catch (e) {
    error.value = 'Неверный логин или пароль'
    console.error(e)
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="flex min-h-svh items-center justify-center bg-default p-6">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-lg font-semibold text-highlighted">
          Вход в CRM
        </h1>
        <p v-if="!isApiEnabled()" class="mt-1 text-sm text-muted">
          Укажите <code>VITE_API_BASE_URL</code> в .env для подключения к API.
        </p>
      </template>

      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <UFormField label="Логин">
          <UInput v-model="formLogin" autocomplete="username" required />
        </UFormField>
        <UFormField label="Пароль">
          <UInput v-model="formPassword" type="password" autocomplete="current-password" required />
        </UFormField>
        <p v-if="error" class="text-sm text-error">
          {{ error }}
        </p>
        <UButton type="submit" label="Войти" color="primary" block :loading="pending" />
      </form>
    </UCard>
  </div>
</template>
