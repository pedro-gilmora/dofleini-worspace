import { DirectiveOptions } from "vue";
import { sleep } from "..";

const validators = {
  required: (v: string) => !!v?.trim() || 'Required',
  requiredDate: (v: Date | null) => !['Invalid Date',''].includes(v?.toString()??'') || 'Required',
  requiredNumber: (v: number | null) => ![NaN, 0 , null].includes(v) || 'Required',
  email: (v: string) => /[\w\-+.]{3,}@[\w\-+]{2,}(?:\.[\w\-+]{1,})+$/.test(v) || 'Invalid email format',
  phone: (v: string) => /^\+?(?:\d+[-\d]*){4,}(\s*ext[\:\.]\s*\d+?(-\d+)?)?$/.test(v) || 'Invalid phone number format'
}
type ValidatorResult = string | true;

export type Validator = (v: any) => (ValidatorResult | Promise<ValidatorResult>) | (ValidatorResult);

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

    //TODO: Form validation hooks
    //TODO: Input styles
    //TODO: Change form validation state
    if (form && !(form as any).validate)
      (form as any).validate = async () => {
        for(const el of form.elements)
          if(!((await (el as any).validate?.()) ?? true))
            return false;
        return true
      }

    let lastValue = input[prop];
    const validate = async () => {
      // debugger
      const elVal = input[prop];

      if(elVal === lastValue && messages.innerHTML) return;
      let res: ValidatorResult | Promise<ValidatorResult> = true,
        innerHtml = messages.innerHTML;

      if(messages.innerHTML){
        for(const mssage of [...messages.querySelectorAll('.validation-error')]){
          mssage.classList.add('hide')
          await sleep(200);
          mssage.remove()
        }
      }

      innerHtml = messages.innerHTML = '';
        
      input.setCustomValidity('');
      
      for (var item of Object.keys(modifiers).filter(key => key in validators).map(key => validators[key])) {
        if (typeof item === 'function') {
          if ((typeof (res = item(elVal)) === 'string') || (res instanceof Promise && typeof (res = await res) == 'string'))
            innerHtml += `<div class="validation-error hide">${res}</div>`;
          else if (typeof (res) == 'string')
            innerHtml += `<div class="validation-error hide">${res}</div>`;
        }
      }
      if (val instanceof Array) {
        for (var item of val) {
          if (typeof item === 'function') {
            if ((typeof (res = item(elVal)) === 'string') || (res instanceof Promise && typeof (res = await res) == 'string'))
              innerHtml += `<div class="validation-error hide">${res}</div>`;
            else if (typeof (res) == 'string')
              innerHtml += `<div class="validation-error hide">${res}</div>`;
          }
        }
      }
      else if (typeof val === 'function') {
        let res: ValidatorResult | Promise<ValidatorResult> = true
        if ((typeof (res = val(elVal)) === 'string') || (res instanceof Promise && typeof (res = await res) == 'string'))
          innerHtml += `<div class="validation-error hide">${res}</div>`;
        else if (typeof (res) == 'string')
          innerHtml += `<div class="validation-error hide">${res}</div>`;
      }
      else if (typeof (val) == 'string')
        innerHtml += `<div class="validation-error hide">${res}</div>`;

      if(innerHtml && input.parentElement?.classList?.contains('has-errors') === false)
        input.parentElement.classList.add('has-errors');

      else if(!innerHtml && input.parentElement?.classList?.contains('has-errors') === true)
        input.parentElement.classList.remove('has-errors');

      messages.innerHTML += innerHtml;

      messages.querySelectorAll('.validation-error').forEach(async el =>{
        await $nextTick();
        el.classList.remove('hide')
      });

      input.setCustomValidity(
        [...messages.querySelectorAll('.validation-error') as NodeListOf<HTMLDivElement>]
          .map(e => e.innerText)
          .join(', ')
      );
      return input.checkValidity()
    };
    
    (input as any).validate = validate;

    input.onblur = async () => {
      await validate()
      const validationMessage = `<div class="validation-error">${input.validationMessage}</div>`
      if(!input.validity.customError && !messages.innerHTML && input.validationMessage && !messages.innerHTML.includes(validationMessage))
        messages.innerHTML += validationMessage;
    }
    if(!modifiers.lazy)
      input.oninput = input.onblur as any
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
