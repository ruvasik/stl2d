import { Route, Switch } from 'wouter';
import { ProjectionViewerPage, NotFoundPage } from '@pages';

export function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={ProjectionViewerPage} />
      <Route path="/404" component={NotFoundPage} />
      {/* Final fallback route */}
      <Route component={NotFoundPage} />
    </Switch>
  );
}
