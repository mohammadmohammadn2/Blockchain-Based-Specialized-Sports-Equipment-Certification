;; Manufacturer Verification Contract
;; Validates legitimate equipment producers

(define-data-var admin principal tx-sender)

;; Map to store verified manufacturers
(define-map verified-manufacturers principal bool)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-ALREADY-VERIFIED u101)
(define-constant ERR-NOT-FOUND u102)

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin)))

;; Add a manufacturer to the verified list
(define-public (add-manufacturer (manufacturer principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-none (map-get? verified-manufacturers manufacturer)) (err ERR-ALREADY-VERIFIED))
    (ok (map-set verified-manufacturers manufacturer true))))

;; Remove a manufacturer from the verified list
(define-public (remove-manufacturer (manufacturer principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-some (map-get? verified-manufacturers manufacturer)) (err ERR-NOT-FOUND))
    (ok (map-delete verified-manufacturers manufacturer))))

;; Check if a manufacturer is verified
(define-read-only (is-verified-manufacturer (manufacturer principal))
  (default-to false (map-get? verified-manufacturers manufacturer)))

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (ok (var-set admin new-admin))))
