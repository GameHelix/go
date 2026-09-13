for i := 0; i < 10; i++ { } // classic
for cond { } // while
for { } // forever; exit with break or return
for i, v := range items { } // index and copy of element (slice/array)
for k, v := range m { } // key and value (map; random order)
for i, r := range "héllo" { } // byte index and rune (string)
for v := range ch { } // until channel closed
for i := range 5 { } // 0..4 (Go 1.22+)
for range 3 { } // three times, no variable