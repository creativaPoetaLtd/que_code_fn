'use client';
import React from 'react';
import { VoteModal } from './VoteModal';
import { TicketModal } from './TicketModal';
import { BookingModal } from './BookingModal';
import { DefaultModal } from './DefaultModal';
import { ModalProps } from './types';

export function ActionModal(props: ModalProps) {
  if (!props.action) return null;

  switch (props.action.type) {
    case 'vote':
      return <VoteModal {...props} />;
    case 'buy':
    case 'ticket':
      return <TicketModal {...props} />;
    case 'booking':
      return <BookingModal {...props} />;
    default:
      return <DefaultModal {...props} />;
  }
}
