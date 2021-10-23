declare global {
  
  namespace JSX {
    // tslint:disable no-empty-interface
    interface Element extends VNode {
    }

    // tslint:disable no-empty-interface
    interface ElementClass extends Vue {
    }

    interface IntrinsicElements {
      [elem: string]: any;
    }

  }

  interface Number {
    between(a: number, b: number): boolean;
    on(a: number): boolean;
  }

}

declare module "vue/types/vue" {

  interface Vue {
    $localData: DeepDictionary;
    $dark: boolean,
    $sessionData: any;
  }
}

declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    localStore?: DeepDictionary,
    sessionStore?: DeepDictionary,
    resources?: DeepDictionary
  }
}
