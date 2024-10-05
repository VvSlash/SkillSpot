import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonLabel, IonItem, IonToast, IonRouterLink } from '@ionic/react';

const Login: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleLogin = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) =>
      (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.password === password
    );

    if (user) {
      localStorage.setItem('loggedInUser', JSON.stringify(user));
      window.location.href = '/home';  // Redirect to home
    } else {
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="floating">Email or Username</IonLabel>
          <IonInput value={usernameOrEmail} onIonChange={(e: { detail: { value: React.SetStateAction<string>; }; }) => setUsernameOrEmail(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Password</IonLabel>
          <IonInput type="password" value={password} onIonChange={(e: { detail: { value: React.SetStateAction<string>; }; }) => setPassword(e.detail.value!)} />
        </IonItem>
        <IonButton expand="block" onClick={handleLogin}>Login</IonButton>

        <IonToast isOpen={showToast} message="Invalid login credentials" duration={2000} onDidDismiss={() => setShowToast(false)} />

        {/* Registration Link */}
        <IonRouterLink routerLink="/register" className="ion-margin-top">
          Don't have an account? Register here.
        </IonRouterLink>

      </IonContent>
    </IonPage>
  );
};

export default Login;
