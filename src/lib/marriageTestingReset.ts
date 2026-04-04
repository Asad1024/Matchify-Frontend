import { clearMarriageDeckListsForTesting } from "@/lib/marriageDeckStore";
import { clearMarriageChatLocalStorageForTesting } from "@/lib/marriageChatRequests";

/**
 * Dev/testing: repopulate Marriage deck and empty Explore → My history (liked / passed / favorites),
 * plus clear local marriage chat demo keys so notifications/requests reset too.
 */
export function resetMarriageTestingState(): void {
  clearMarriageDeckListsForTesting();
  clearMarriageChatLocalStorageForTesting();
}
