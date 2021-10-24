import { DirectiveOptions } from "vue";
import { sleep } from "..";

const validators = {
  required: (v: string) => !!v?.trim() || 'Required',
  requiredDate: (v: Date | null) => !['Invalid Date',''].includes(v?.toString()??'') || 'Required',
  requiredNumber: (v: number | null) => ![NaN, 0 , null].includes(v) || 'Required',
  email: (v: string) => /[\w\-+.]{3,}@[\w\-+]{2,}(?:\.[\w\-+]{1,})+$/.test(v) || 'Invalid email format',
  phone: (v: string) => /^\+?(?:\d+[-\d]*){4,}(\s*ext[\:\.]\s*\d+?(-\d+)?)?$/.test(v) || 'Invalid phone number format'
}
type ValidatorResult = string | true | Promise<ValidatorResult>;
type ValidationCache = {value: ValidatorResult, lastValue: ValidatorResult};

export type ValidatableForm = HTMLFormElement & {validate(): Promise<boolean>}

export type Validator = (v: any) => (ValidatorResult | Promise<ValidatorResult>) | (ValidatorResult);

function addValidationResult(map: Map<Validator, ValidatorResult>, validator: Validator, res: ValidatorResult){
  if(map.get(validator) === res) return;
  map.set(validator, res);
}

export default {

  async inserted(_el, { value, modifiers }, { context, componentInstance }) {

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

    let def = arguments[1].def

    if(!(input instanceof HTMLInputElement)) return
    
    if (form && !(form as any).validate)
      (form as any).validate = async () => {
        for(const el of form.elements)
          if(!((await (el as any).validate?.()) ?? true))
            return false;
        return true
      }

    let lastValue = input[prop],
      validationMap = new Map<Validator, ValidationCache>();
      
    const validate = async () => {
      // debugger
      const elVal = input[prop];

      let res: ValidatorResult = true,
        hasErrors = false;
      
      for (var item of Object.keys(modifiers).filter(key => key in validators).map(key => validators[key])) {
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

      else if(!hasErrors && input.parentElement?.classList?.contains('has-errors') === true)
        input.parentElement.classList.remove('has-errors');

      const result = [...validationMap.values()];
      messages.innerHTML = result.map(({lastValue, value}) => {
        let toggle = '';
        if(lastValue !== value){
          if(typeof lastValue === 'string')
            toggle += ' to-hide'
          if(typeof lastValue !== 'string')
            toggle += ' show'
        }
        return `<div class="validation-error${toggle}">${value === true ? '' : value}</div>`
      }).join('');

      const errors = [...messages.querySelectorAll('.validation-error') as NodeListOf<HTMLDivElement>];    

      for(let div of errors){
        await sleep(100)
        if(div.classList.contains('show'))
          div.classList.remove('show')
        if(div.classList.contains('hide')){
          div.remove()
        }
      }

      const strErrors = result
        .filter(({ value }) => value !== true)
        .map(({ value }) =>  value? '' : value).join(', ');
      console.log(input, strErrors)

      input.setCustomValidity(strErrors);
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
