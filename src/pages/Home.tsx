import React from 'react';
import { IonCol, IonGrid, IonRow, IonButton } from '@ionic/react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Home.css';

const handleLogout = () => {
  localStorage.removeItem('loggedInUser');
  window.location.href = '/login';  // Redirect to login
};

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>SkillSpot</IonTitle>
        </IonToolbar>
      </IonHeader>
      <ExploreContainer name="Home">
        <IonGrid>
        <IonRow>
            <IonCol>
            <IonButton expand="block" color="danger" onClick={handleLogout}>Logout</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton expand="block" routerLink="/training">Start Training</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton expand="block" routerLink="/progress">View Progress</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton expand="block" routerLink="/trainer">Connect with Trainer</IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </ExploreContainer>
    </IonPage>
  );
};

export default Home;