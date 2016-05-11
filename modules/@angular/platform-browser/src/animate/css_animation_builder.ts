import {CssAnimationOptions} from './css_animation_options';
import {Animation} from './animation';
import {BrowserDetails} from './browser_details';

export class CssAnimationBuilder {
  data: CssAnimationOptions = new CssAnimationOptions();

  /**
   * Accepts public properties for CssAnimationBuilder
   */
  constructor(public browserDetails: BrowserDetails) {}

  /**
   * Adds a temporary class that will be removed at the end of the animation
   */
  addAnimationClass(className: string): CssAnimationBuilder {
    this.data.animationClasses.push(className);
    return this;
  }

  /**
   * Adds a class that will remain on the element after the animation has finished
   */
  addClass(className: string): CssAnimationBuilder {
    this.data.classesToAdd.push(className);
    return this;
  }

  /**
   * Removes a class from the element
   */
  removeClass(className: string): CssAnimationBuilder {
    this.data.classesToRemove.push(className);
    return this;
  }

  /**
   * Sets the animation duration (and overrides any defined through CSS)
   */
  setDuration(duration: number): CssAnimationBuilder {
    this.data.duration = duration;
    return this;
  }

  /**
   * Sets the animation delay (and overrides any defined through CSS)
   */
  setDelay(delay: number): CssAnimationBuilder {
    this.data.delay = delay;
    return this;
  }

  /**
   * Sets styles for both the initial state and the destination state
   */
  setStyles(from: {[key: string]: any}, to: {[key: string]: any}): CssAnimationBuilder {
    return this.setFromStyles(from).setToStyles(to);
  }

  /**
   * Sets the initial styles for the animation
   */
  setFromStyles(from: {[key: string]: any}): CssAnimationBuilder {
    this.data.fromStyles = from;
    return this;
  }

  /**
   * Sets the destination styles for the animation
   */
  setToStyles(to: {[key: string]: any}): CssAnimationBuilder {
    this.data.toStyles = to;
    return this;
  }

  /**
   * Starts the animation and returns a promise
   */
  start(element: HTMLElement): Animation {
    return new Animation(element, this.data, this.browserDetails);
  }
}
