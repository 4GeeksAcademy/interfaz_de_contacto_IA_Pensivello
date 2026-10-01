# interfaz_de_contacto_IA_Pensivello

## Requisitos

- Node.js instalado.
- `pnpm` instalado.
- Una clave de API de Groq.

## Configuración y comandos

Instala las dependencias:

```bash
pnpm install
```

Crea un archivo `.env.local` en la raíz del proyecto con la clave del servidor:

```env
GROQ_API_KEY=tu_clave_de_groq
```

Inicia la aplicación en modo desarrollo:

```bash
pnpm dev
```

Después, abre [http://localhost:3000](http://localhost:3000).

Para generar una compilación de producción y ejecutarla:

```bash
pnpm build
pnpm start
```

El servidor de producción también utiliza el puerto `3000`.

## Páginas y rutas utilizadas

- `/`: interfaz principal de `arc/chat`, con historial de conversaciones, envío de mensajes y métricas de tokens.
- `/api/chat`: endpoint interno `POST` que recibe el historial en el campo `messages` y devuelve la respuesta generada junto con el uso de tokens.

La interfaz guarda el historial de la conversación en `localStorage` del navegador.

## Modelo de IA

Las respuestas se generan mediante la API compatible con OpenAI de **Groq**, usando el modelo:

```text
openai/gpt-oss-20b
```

El modelo está configurado en `app/api/chat/route.ts` y la clave `GROQ_API_KEY` solo se utiliza en el servidor.