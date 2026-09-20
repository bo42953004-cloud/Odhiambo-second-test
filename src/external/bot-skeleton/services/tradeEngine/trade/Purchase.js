import { LogTypes } from '../../../constants/messages';
import { api_base } from '../../api/api-base';
import { contractStatus, info, log } from '../utils/broadcast';
import { doUntilDone, getUUID, recoverFromError, tradeOptionToBuy } from '../utils/helpers';
import { purchaseSuccessful } from './state/actions';
import { BEFORE_PURCHASE } from './state/constants';

let delayIndex = 0;
let purchase_reference;

export default Engine =>
    class Purchase extends Engine {
        async purchase(contract_type) {
            // Prevent calling purchase twice
            if (this.store.getState().scope !== BEFORE_PURCHASE || this.purchase_in_flight) {
                return;
            }

            this.purchase_in_flight = true;

            const onSuccess = response => {
                // Don't unnecessarily send a forget request for a purchased contract.
                const buy = response?.buy;
                if (!buy?.contract_id || !buy?.transaction_id) {
                    throw new Error('The Deriv API did not return a valid purchase response.');
                }

                contractStatus({
                    id: 'contract.purchase_received',
                    data: buy.transaction_id,
                    buy,
                });

                this.contractId = buy.contract_id;
                this.store.dispatch(purchaseSuccessful());

                if (this.is_proposal_subscription_required) {
                    this.renewProposalsOnPurchase();
                }

                delayIndex = 0;
                this.purchase_in_flight = false;
                log(LogTypes.PURCHASE, { transaction_id: buy.transaction_id });
                info({
                    accountID: this.accountInfo.loginid,
                    totalRuns: this.updateAndReturnTotalRuns(),
                    transaction_ids: { buy: buy.transaction_id },
                    contract_type,
                    buy_price: buy.buy_price,
                });
            };

            if (this.is_proposal_subscription_required) {
                let id;
                let askPrice;
                try {
                    ({ id, askPrice } = this.selectProposal(contract_type));
                } catch (error) {
                    this.purchase_in_flight = false;
                    throw error;
                }

                const action = () => {
                    if (!api_base.api || api_base.api.connection?.readyState !== 1) {
                        throw new Error('Deriv connection is not ready for purchase.');
                    }
                    return api_base.api.send({ buy: id, price: askPrice });
                };

                this.isSold = false;

                contractStatus({
                    id: 'contract.purchase_sent',
                    data: askPrice,
                });

                if (!this.options.timeMachineEnabled) {
                    return doUntilDone(action, [], api_base)
                        .then(onSuccess)
                        .finally(() => { this.purchase_in_flight = false; });
                }

                return recoverFromError(
                    action,
                    (errorCode, makeDelay) => {
                        // if disconnected no need to resubscription (handled by live-api)
                        if (errorCode !== 'DisconnectError') {
                            this.renewProposalsOnPurchase();
                        } else {
                            this.clearProposals();
                        }

                        const unsubscribe = this.store.subscribe(() => {
                            const { scope, proposalsReady } = this.store.getState();
                            if (scope === BEFORE_PURCHASE && proposalsReady) {
                                makeDelay().then(() => this.observer.emit('REVERT', 'before'));
                                unsubscribe();
                            }
                        });
                    },
                    ['PriceMoved', 'InvalidContractProposal'],
                    delayIndex++
                )
                    .then(onSuccess)
                    .finally(() => { this.purchase_in_flight = false; });
            }
            const trade_option = tradeOptionToBuy(contract_type, this.tradeOptions);
            const action = () => {
                if (!api_base.api || api_base.api.connection?.readyState !== 1) {
                    throw new Error('Deriv connection is not ready for purchase.');
                }
                return api_base.api.send(trade_option);
            };

            this.isSold = false;

            contractStatus({
                id: 'contract.purchase_sent',
                data: this.tradeOptions.amount,
            });

            if (!this.options.timeMachineEnabled) {
                return doUntilDone(action, [], api_base)
                    .then(onSuccess)
                    .finally(() => { this.purchase_in_flight = false; });
            }

            return recoverFromError(
                action,
                (errorCode, makeDelay) => {
                    if (errorCode === 'DisconnectError') {
                        this.clearProposals();
                    }
                    const unsubscribe = this.store.subscribe(() => {
                        const { scope } = this.store.getState();
                        if (scope === BEFORE_PURCHASE) {
                            makeDelay().then(() => this.observer.emit('REVERT', 'before'));
                            unsubscribe();
                        }
                    });
                },
                ['PriceMoved', 'InvalidContractProposal'],
                delayIndex++
            )
                .then(onSuccess)
                .finally(() => { this.purchase_in_flight = false; });
        }
        getPurchaseReference = () => purchase_reference;
        regeneratePurchaseReference = () => {
            purchase_reference = getUUID();
        };
    };
