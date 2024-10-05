import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonLabel, IonItem, IonToast } from '@ionic/react';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleRegister = () => {
    if (password !== confirmPassword) {
      setShowToast(true);
      return;
    }

    // Save user data to localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const newUser = { username, email, password };
    localStorage.setItem('users', JSON.stringify([...users, newUser]));

    // Redirect to login page after successful registration
    window.location.href = '/login';
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Create an Account</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="floating">Username</IonLabel>
          <IonInput value={username} onIonChange={(e: { detail: { value: React.SetStateAction<string>; }; }) => setUsername(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Email</IonLabel>
          <IonInput value={email} onIonChange={(e: { detail: { value: React.SetStateAction<string>; }; }) => setEmail(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Password</IonLabel>
          <IonInput type="password" value={password} onIonChange={(e: { detail: { value: React.SetStateAction<string>; }; }) => setPassword(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Confirm Password</IonLabel>
          <IonInput type="password" value={confirmPassword} onIonChange={(e: { detail: { value: React.SetStateAction<string>; }; }) => setConfirmPassword(e.detail.value!)} />
        </IonItem>
        <IonButton expand="block" onClick={handleRegister}>Register</IonButton>

        {/* Toast to show error message if passwords do not match */}
        <IonToast isOpen={showToast} message="Passwords do not match" duration={2000} onDidDismiss={() => setShowToast(false)} />
      </IonContent>
    </IonPage>
  );
};

export default Register;
