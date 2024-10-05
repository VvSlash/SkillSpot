import React, { Suspense, lazy } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import PrivateRoute from './components/PrivateRoute'; // Import PrivateRoute

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import Summary from './pages/Summary';

const Home = lazy(() => import('./pages/Home'));
const Training = lazy(() => import('./pages/Training'));
const Progress = lazy(() => import('./pages/Progress'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Suspense fallback={<div>Loading...</div>}>
          {/* Public Routes */}
          <Route path="/login" component={Login} exact />
          <Route path="/register" component={Register} exact />
          
          {/* Private Routes */}
          <PrivateRoute path="/home" component={Home} exact />
          <PrivateRoute path="/training" component={Training} exact />
          <PrivateRoute path="/progress" component={Progress} exact />
          <PrivateRoute path="/summary" component={Summary} exact />

          {/* Redirect default route */}
          <Route exact path="/" render={() => <Redirect to="/home" />} />
        </Suspense>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
