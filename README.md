# 404Squad-bot
<a href="https://discord.gg/zFDNYNyCBa">Discord Server</a><br/>
Будет на русском, ибо я ленивый и это никто никогда не увидит. <br/>
> Установка: `npm install` <br/>
> Запуск: `node main.js` <br/>

**Конфигурация(config.json):**<br/>
`token: string` - Ключ авторизации бота. Без него ничего работать, очевидно, не будет.<br/>
`admins: string[]` - ID пользователей, которые могут управлять ботом. Нужно только для запуска эмуляции (eval(string)) или перезапуска.<br/>
`prefix: string` - Префикс бота для комманд.<br/>
`voiceChannel: string` - ID голосового канала, где будет играть радио от бота. Если не нужно - значение заменить на `null`<br/>
`radio: HTTPS|HTTP url` - ссылка на стрим радио - принимает HTTP или HTTPS протокол.<br/>
`cacheAllMembers: boolean` - Кэшировать ли пользователей указаноого сервера (сервер указывается в `reaction.guild`)<br/>
<br/>
`reaction.guild: string` - ID сервера. Очень желательно указать.<br/>
`reaction.channel: string` - ID канала, где будет работат role of reaction(Роли от реакций). Если не требуется - `null`.<br/>
`reaction.message: string` - ID сообщения, где будут ставиться реакции. Должно быть валидно, если `reaction.channel` не равен нулю. <br/>
`reaction.roles: {[emoji: string]: string}` - Ключ - реакция, а значение - ID роли, которая должна выдаться. Если эмоджи из стандартного набора Discord'a, то указывается как символьный эмоджи(🛠️), а не конструкторный(:tools:)<br/>
<br/>
`privateVoiceChannels.main_id: string` - ID канала, куда надо зайти, чтобы создать приватный канал. Если не нужен - указывается `null`.<br/>
`privateVoiceChannels.parent: string` - ID категории, в который будут создаваться каналы.<br/>
`privateVoiceChannels.position: number` - Позиция создающегося приватного канала в категории.<br/>

`auto-images: object` - Настройки авто-постинга ресурсов(предположительно изображений, но можно не только). Если не требуется - указывается `null`<br/>
`auto-images.webhook.[explicit|safe].id: string` - ID вебхука.<br/>
`auto-images.webhook.[explicit|safe].token: string` - Токен вебхука.<br/>
`auto-images.sources: {[name: string]: url}:` - Исходные HTTP/HTTPS ресурсы, где будут браться изображения/видео и другое. Предоставляется отдельный класс, если API предоставляет неподобающий вид данных.<br/>
<br/><br/>
Нет ничего более вечного, чем временное.
