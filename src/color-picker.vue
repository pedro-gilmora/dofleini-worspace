<template lang="pug">
a-row(type="flex" justify="start" align="top" :gutter="[12,12]")
  a-col.mt-2(:span="2" v-for="color of colors" :key="color")
    a-button.color-button(
      size="large"
      :class="{ active: colorValue === color }"
      shape="round"
      :style="`background-color: ${color};`"
      @click="colorValue = color"
    )
</template>
<script lang="ts">
import {Component, Vue, VModel, Prop} from 'vue-property-decorator'
@Component
export default class ColorPicker extends  Vue{
  @Prop()
  colors!: string[]
  @VModel()
  colorValue!: string
}
</script>
