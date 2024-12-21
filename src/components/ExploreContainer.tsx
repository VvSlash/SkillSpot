import './ExploreContainer.css';

import React, { ReactNode } from 'react';
import { IonContent } from '@ionic/react';

interface ExploreContainerProps {
  name: string;
  children: ReactNode;
}

const ExploreContainer: React.FC<ExploreContainerProps> = ({ name, children }) => {
  return (
    <IonContent className="ion-padding">
      <h2>{name}</h2>
      {children}
    </IonContent>
  );
};

export default ExploreContainer;

