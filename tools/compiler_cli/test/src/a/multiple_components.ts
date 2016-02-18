import {Component} from 'angular2/src/core/metadata';

@Component({
  selector: 'my-comp',
  template: '<div></div>',
})
export class MyComp {
}

@Component({
  selector: 'next-comp',
  templateUrl: './multiple_components.html',
})
export class NextComp {
}
