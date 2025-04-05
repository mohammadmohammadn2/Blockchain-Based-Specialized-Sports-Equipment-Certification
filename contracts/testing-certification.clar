;; Testing Certification Contract
;; Records compliance with safety standards

(define-data-var admin principal tx-sender)

;; Map to store equipment certifications
(define-map equipment-certifications
  { equipment-id: (string-ascii 64), standard-id: (string-ascii 32) }
  { certified: bool, timestamp: uint, certifier: principal })

;; Error codes
(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-ALREADY-CERTIFIED u101)
(define-constant ERR-NOT-FOUND u102)

;; Map to store authorized certifiers
(define-map authorized-certifiers principal bool)

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin)))

;; Check if caller is authorized certifier
(define-private (is-authorized-certifier)
  (default-to false (map-get? authorized-certifiers tx-sender)))

;; Add a certifier
(define-public (add-certifier (certifier principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (ok (map-set authorized-certifiers certifier true))))

;; Remove a certifier
(define-public (remove-certifier (certifier principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (ok (map-delete authorized-certifiers certifier))))

;; Certify equipment
(define-public (certify-equipment (equipment-id (string-ascii 64)) (standard-id (string-ascii 32)))
  (let ((cert-key { equipment-id: equipment-id, standard-id: standard-id }))
    (begin
      (asserts! (or (is-admin) (is-authorized-certifier)) (err ERR-NOT-AUTHORIZED))
      (asserts! (is-none (map-get? equipment-certifications cert-key)) (err ERR-ALREADY-CERTIFIED))
      (ok (map-set equipment-certifications cert-key
                  { certified: true, timestamp: block-height, certifier: tx-sender })))))

;; Check if equipment is certified for a specific standard
(define-read-only (is-certified (equipment-id (string-ascii 64)) (standard-id (string-ascii 32)))
  (let ((cert-info (map-get? equipment-certifications { equipment-id: equipment-id, standard-id: standard-id })))
    (if (is-some cert-info)
        (get certified (unwrap-panic cert-info))
        false)))

;; Get certification details
(define-read-only (get-certification-details (equipment-id (string-ascii 64)) (standard-id (string-ascii 32)))
  (map-get? equipment-certifications { equipment-id: equipment-id, standard-id: standard-id }))

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (ok (var-set admin new-admin))))
