import { observe as VMObserve } from '@violentmonkey/dom';
import { beep } from '../utils';

class MessageLogManager {
    #stopObserving: (() => void) | null = null;

    init = () => {
        // Find the message log DOM element.
        const messageQueueLog = document.getElementById('msgQueueLog');
        if (!messageQueueLog) {
            console.warn('[MessageLogManager]: Could not init - Message queue log dom element was not found.');
            return;
        }

        // Observe the message log for new messages.
        this.#stopObserving = VMObserve(messageQueueLog, (mutationRecords) => {
            const mutationRecord = mutationRecords[0];
            if (!mutationRecord) return false;

            // Iterate over freshly added dom nodes (message elements).
            mutationRecord.addedNodes.forEach((addedNode) => {
                // Get the text content of the added node.
                const nodeText = addedNode.textContent?.trim()?.toLowerCase();
                if (!nodeText) return false;

                // Handle the new message.
                this.#handle_new_message(nodeText);
            });
        });
    };

    stop = () => {
        if (this.#stopObserving) {
            this.#stopObserving();
            this.#stopObserving = null;
        }
    };

    #handle_new_message = (msg: string) => {
        // Check for fortress overrun messages.
        if (msg.startsWith('your fortress was overrun')) {
            beep();
            alert('Fortress overrun!');
            return;
        }

        // Beep for all other messsages.
        beep();
    };
}

export const message_log_manager = new MessageLogManager();
