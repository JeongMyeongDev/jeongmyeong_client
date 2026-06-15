import type { ReactNode } from 'react';
import styled from 'styled-components';

interface ProfileSectionProps {
  title: string;
  children: ReactNode;
}

const ProfileSection = ({ title, children }: ProfileSectionProps) => (
  <Section>
    <Title>{title}</Title>
    <Card>{children}</Card>
  </Section>
);

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Title = styled.h2`
  margin: 0;
  color: #2f3238;
  font-size: clamp(15px, 4vw, 17px);
  font-weight: 700;
  text-align: left;
`;

const Card = styled.div`
  background: #efefef;
  border-radius: var(--card-radius);
  padding: 4px clamp(16px, 4.2vw, 18px);
`;

export default ProfileSection;
