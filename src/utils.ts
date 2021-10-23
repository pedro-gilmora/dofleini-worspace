import config from "vite.config"
import Vue, { ComputedOptions, VueConstructor } from "vue"


export const useSession = <T>(values: T) => {

  return (Vue as VueConstructor<Vue & T>).extend({
    data() {
      return Object.entries(values).reduce((res, [key, config]) => {
        res[key] = JSON.parse(sessionStorage[((this as any).$route?.path ?? '/') + "#" + key] ?? 'null') || config;
        return res
      }, {});
    },
    watch: Object.keys(values).reduce((res, key) => {
      res[key] = {
        deep: true,
        handler(v: any) {
          this.p
          sessionStorage[((this as any).$route?.path ?? '/') + "#" + key] = JSON.stringify(v ?? 'null')
        }
      }
      return res
    }, {})
  })
}

export const usePersistent = <T>(values: T) => {

  return (Vue as VueConstructor<Vue & T>).extend({
    data() {
      return Object.entries(values).reduce((res, [key, config]) => {
        res[key] = JSON.parse(localStorage[((this as any).$route?.path ?? '/') + "#" + key] ?? 'null') || config;
        return res
      }, {});
    },
    watch: Object.keys(values).reduce((res, key) => {
      res[key] = {
        deep: true,
        handler(v: any) {
          this.p
          localStorage[((this as any).$route?.path ?? '/') + "#" + key] = JSON.stringify(v ?? 'null')
        }
      }
      return res
    }, {})
  })
}