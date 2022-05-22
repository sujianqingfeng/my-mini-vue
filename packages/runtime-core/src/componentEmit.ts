import { camelize, toHandleKey } from "@mini-vue/shared"

export const emit = (instance, event, ...args) => {
  const { props } = instance

  const handleName = toHandleKey(camelize(event))

  const handler = props[handleName]

  handler?.(...args)
}
