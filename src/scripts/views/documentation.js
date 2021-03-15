import Backbone from 'backbone';
import marked from 'marked';
import { t } from '../translations';

export default class DocumentationView extends Backbone.View {
  className = 'inner deep prose limiter';

  render() {
    this.$el.empty()
      .append(marked(t('about.content')));
    return this;
  }
}
