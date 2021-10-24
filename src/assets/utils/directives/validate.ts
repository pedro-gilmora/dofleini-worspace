import Vue, { DirectiveOptions } from "vue";
import { sleep } from "..";

// noinspection JSUnusedGlobalSymbols
const validators = {
  required: (v: string) => !!v?.trim() || 'Required',
  requiredDate: (v: Date | null) => !['Invalid Date',''].includes(v?.toString()??'') || 'Required',
  requiredNumber: (v: number | null) => ![NaN, 0 , null].includes(v) || 'Required',
  email: (v: string) => /[\w\-+.]{3,}@[\w\-+]{2,}(?:\.[\w\-+]{1,})+$/.test(v) || 'Invalid email format',
  phone: (v: string) => /^\+?(?:\d+[-\d]*){4,}(\s*ext[:.]\s*\d+?(-\d+)?)?$/.test(v) || 'Invalid phone number format'
}
type ValidatorResult = string | true | Promise<ValidatorResult>;
type ValidationCache = {value: ValidatorResult, lastValue: ValidatorResult};

export type ValidatableForm = HTMLFormElement & {validate(): Promise<boolean>}

export type Validator = ValidatorResult |  ((v: any) => ValidatorResult | Promise<ValidatorResult>);

// noinspection JSUnusedGlobalSymbols
export default {

  async inserted(_el, { value, def, modifiers }, { /*context,*/ componentInstance }) {

    const input = ((componentInstance?.$refs?.input) ?? _el) as HTMLInputElement, 
      messages: HTMLElement = getMessagesSlot(input),
      form = input.form,
      $nextTick = componentInstance?.$nextTick ?? context!.$nextTick,
      val = value as Validator | Validator[],
      prop = {
        'INPUT-CHECKBOX': 'checked',
        'INPUT-NUMBER': 'valueAsNumber',
        'INPUT-DATE': 'valueAsDate'
      }[(input.tagName + '-' + (input as any).type).toUpperCase()] ?? 'value';
    
    if(!(input instanceof HTMLInputElement)) return;
    
    if (form && !(form as any).validate)
      (form as any).validate = async () => {
        for(const el of form.elements)
          if(!((await (el as any).validate?.()) ?? true))
            return false;
        return true
      }

    const validationMap = new Map<Validator, ValidationCache>();
      
    const validate = async () => {
      // debugger
      const elVal = input[prop];

      let hasErrors = false;
      
      for (let item of Object.keys(modifiers).filter(key => key in validators).map(key => validators[key])) {
        if (typeof item === 'function') {
          hasErrors = typeof(await registerValidation(item, elVal)) === 'string' || hasErrors;
        }
      }
      if (val instanceof Array) {
        for (var [i, item] of val.map((v, i) => [v, i])) {
          if (typeof item === 'function') 
            hasErrors = typeof(await registerValidation(item, elVal)) === 'string' || hasErrors;
          else
            hasErrors = typeof(await registerValidation(`val[${i}]`, elVal)) === 'string' || hasErrors;
        }
      }
      else if (typeof val === 'function') {
        hasErrors = typeof(await registerValidation(val, elVal)) === 'string' || hasErrors;
      }
      else if (typeof (val) == 'string')
        hasErrors = typeof(await registerValidation(`val`, elVal)) === 'string' || hasErrors;

      if(hasErrors && input.parentElement?.classList?.contains('has-errors') === false)
        input.parentElement.classList.add('has-errors');

      const result = [...validationMap.values()];
      messages.innerHTML = result.map(({lastValue, value}) => {
        let toggle = '', style = '';
        if(lastValue !== value){
          if(typeof lastValue === 'string') {
            toggle += ' to-hide';
          }
          if(typeof lastValue !== 'string') {
            toggle += ' to-show';
            style += 'transform: translateY(-14px); opacity: 1;';
          }
        }
        return `<div class="validation-error${toggle}" style="${style}">
            ${typeof value !== "string" ? (typeof lastValue !== "string" ? '' : lastValue) : value}
        </div>`
      }).join('');

      const errors = [...messages.querySelectorAll('.validation-error') as NodeListOf<HTMLDivElement>];

      for(let div of errors){
        if(div.classList.contains('to-show')) {
          const anim = div.animate({
            transform: 'translateY(0)',
            opacity: 1
          }, {duration: 100});
          anim.onfinish = _ => {
            div.style = undefined
            div.classList.remove('to-show')
          };
        }
        if(div.classList.contains('to-hide')){
          const anim = div.animate({
            transform: 'translateY(-1em)',
            opacity: 0
          }, {duration: 100});
          anim.onfinish = async _ => {
            console.log(errors, result)
            div.remove();
            await $nextTick();
            if(!messages.innerText && input.parentElement?.classList?.contains('has-errors') === true)
              input.parentElement.classList.remove('has-errors');
          }
        }
      }
      // console.log(input, strErrors)

      input.setCustomValidity(messages.innerText);
      return input.checkValidity()
    };
    
    (input as any).validate = validate;

    input.onblur = async () => {
      await validate()
    }
    if(!modifiers.lazy)
      input.oninput = validate as any

    async function registerValidation(item: Function | string | boolean, elVal: any) {
      let res: ValidatorResult | Promise<ValidatorResult> = typeof item === 'function' ? item(elVal) : item;
      if ((res as any) instanceof Promise)
        res = await res;
      validationMap.set(item, { value: res, lastValue: validationMap.get(item)?.value });
      return res
    }
  }
} as DirectiveOptions

function getMessagesSlot(input: HTMLInputElement): HTMLElement {
  const messages = input.parentElement?.querySelector('div.messages') ?? createMessagePlaceholder();
  if (messages.parentElement === null)
  input.parentElement?.append(messages);
  return messages as HTMLElement;
}

function createMessagePlaceholder() {
  const div = document.createElement('div');
  div.classList.add('messages', 'col-12')
  div.style.order = '5'
  return div;
}
