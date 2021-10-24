<template lang="pug">
form(ref="form").p-4
  a-row(type="flex" justify="center" align="top" :gutter="[24,24]")

    a-col(:span="20" :lg={span: 12})
      h1 Configuración
      h3 Logo del espacio
      a-space
        div.logo(
          v-if="workSpace.logoUrl"
          :style="`background-image: url(${getLogo(workSpace.logoUrl)});`"
        )
        a-avatar(v-else :size="64" style="background: #343c4a; font-size: 32px") 
          span {{getCapitals(workSpace?.name)}}
        a-button(icon="upload" @click="() => $refs.icon.click()") Subir logo
        input(hidden accept="image/*" ref="icon" type="file" @change="onFilePicked")
      br
      a-space.py-4(align="start")
        a-icon(type="info-circle")
        div Este logo identificará tu espacio entre el resto.
          br
          | Preferiblemente sube una imagen .png igual o superior a 65px a 72ppp con fondo transparente.
      br

      b Nombre del espacio
      a-form-item.mt-2
        a-input(size="large" placeholder="Ep: Mi espacio de trabajo" v-model="workSpace.name" v-validate.required)
     
      b URL del espacio (dirección web)
      a-form-item.mt-2
        a-input(size="large" v-model="workSpace.domain" suffix=".plakton.com" v-validate.required="workSpace.name ? invalidDomain : undefined" placeholder="Ep: mi.dominio")
    
      a-space.py-4(align="start")
        a-icon(type="info-circle")
        div Este logo identificará tu espacio entre el resto.
          br
          | Puedes cambiar la URL de tu espacio (dirección web) en cualquier momento, pero por cortesía hacia tus compañeros de trabajo y otros usuarios de Plankton, porfavor no lo hagas muy seguido :)
          br
          p.pt-2 Nota: Si cambias la URL de tu espacio, Plankton automáticamente redireccionará desde la antigua dirección hacia la nueva. En cualquier caso, deberías asegurarte que tus compañeros sepan acerca del cambio porque la dirección anterior pasará a estar libre y puede ser usada por otro espacio en el futuro.
      br

      //- a-col(:span="24" :md={span: 12})

      b ¿Cuántas personas trabajarán contigo, incluyéndote a ti?
      br
            
      a-space.mt-2.mb-4(:md="{span:4}")
        a-button(
          size="large"
          v-for="(teamSize, sizeIndex) of teamSizes" :key="sizeIndex"
          :class="{ active: sizeIndex === workSpace.teamSize }"
          @click="workSpace.teamSize = sizeIndex"
        ) {{ teamSize }}
      br 
      
      
      b Color del tema
      br      
      color-picker(:colors="colors" v-model="workSpace.color")
      br

      
      b Privacidad del espacio
      br
      a-row(type="flex" justify="start" align="top" :gutter="[12,12]")
        a-col.mt-2(:span="12" v-for="(privacy, privacyIndex) of privacy" :key="privacyIndex")
          a-radio-group(v-model="workSpace.isPrivate")
            a-button.workspace-privacy-btn(
              size="large"
              :class="{ active: workSpace.isPrivate === privacy.value }"
              @click="workSpace.isPrivate = privacy.value"
            ) 
              a-space.py-2(align="start")
                a-radio(:value="privacy.value")
                div {{privacy.state}}
                  br
                  .desc {{privacy.desc}}
      //- Buttons           
      a-space.mt-8
        a-button(
          size="large"
          type="primary"
          @click="submit"
        ) Guardar cambios

        a-button(
          size="large"
        ) Descartar

    a-col(:span="24" :lg={span: 12})
      preview(:domain="workSpace.domain" :title="workSpace.name" :color="workSpace.color")
</template>

<style lang="sass">
.workspace-privacy-btn
  text-align: left
  height: auto
  white-space: break-spaces

  .desc
    opacity: .7

.ant-btn:active
    color: #096dd9

.color-button
  border: none
  &.active::after
    border: 5px solid white
    content: ""
    position: absolute
    width: 34px
    height: 34px
    transform: translate(3px, 3px) !important
    left: 0 !important
    top: 0 !important
    transition: none
    animation: none
    border-radius: 99px
    opacity: 1
    
.logo
  width: 64px
  height: 64px
  border-radius: 64px
  background-size: cover
  background-position: center
</style>


<script lang="tsx">
import { Component, Provide, Ref, Vue } from "vue-property-decorator";
import {sleep, usePersistent} from "@/assets/utils";
import Preview from '@/work-space.preview.vue';
import validate, {ValidatableForm} from '@/assets/utils/directives/validate'
import ColorPicker from "@/color-picker.vue";

@Component<App>({
  components: {ColorPicker, Preview},
  directives: {validate},
  mixins: [
    usePersistent({
      workSpace: {
        logoUrl: "",
        name: "",
        domain: "",
        teamSize: null,
        color: null,
        isPrivate: null
    }
  })]
})
export default class App extends Vue {

  @Ref('form')
  form!: ValidatableForm;
  
  saving = false;

  rules = {
    name: [
      { required: true, message: 'Name is mandatory', trigger: 'blur' }
    ]
  };

  privacy = [
    {
      state: 'Privado', 
      desc: 'El contenido será visible sólo para tí y los miembros de tu Organización.',
      value: true
    }, 
    {
      state: 'Público',
      desc: 'Cualquiera con el vínculo podrá ver la actividad de tu Organización',
      value: false
    }
  ];

  teamSizes = ["Sólo yo", "2 - 10", "1 - 25", "26 - 50", "51 - 100", "100+"];

  colors = [
    "#39B0FF",
    "#04B58B",
    "#3E9C4B",
    "#B6BC00",
    "#E59100",
    "#E55C00",
    "#D6198A",
    "#B321F1",
    "#2098e2",
  ];

  @Provide()
  workSpace!: any

  invalidDomain(str: string){
    return /^(?!\.)[\w\d-.]*(?<!\.)$/.test(str) || 'Invalid domain format'
  }

  getCapitals(k: string){
    return ((k?.split(/\s+/)?.map(el => el?.[0]?.toUpperCase() ?? '').slice(0,2).join('')) || '?').trim();
  }

  onFilePicked({target: {files}}: any){
    const file = new FileReader(), firstFile = files?.[0];
    if(firstFile){
      file.onloadend = () => {
        localStorage[`img:${this.workSpace.logoUrl = firstFile.name}`] = file.result
      }
      file.readAsDataURL(firstFile);
    }
  }

  getLogo(url: string){
    return localStorage[`img:${url}`]
  }

  async submit(){
    if(!this.saving){
      const $ = this as any;
      if(await this.form.validate()) {
        this.saving = true
        await $.$message.loading('Creando espacio de trabajo...', 3);
        await $.$message.success(() => <span>Espacio de trabajo <b>{this.workSpace.name}</b> creado exitosamente</span>, 5);
        this.saving = false;
      }
      else
        await $.$message.error(() => <span>La configuración contiene errores</span>, 5);
    }
  }
}
</script>