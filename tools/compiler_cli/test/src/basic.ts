import {Component, Injectable} from 'angular2/core';

@Component({
  selector: 'basic',
  templateUrl: './basic.html',
})
@Injectable()
export class Basic {
  ctxProp: string;
  constructor() { this.ctxProp = 'initial value'; }
}
