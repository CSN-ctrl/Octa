// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Common utilities for actions

package actions

import (
	"github.com/ava-labs/avalanchego/utils/wrappers"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/consts"
)

// MarshalAction is a helper function to serialize an action
func MarshalAction(typeID uint8, action interface{}) []byte {
	p := &wrappers.Packer{
		Bytes:   make([]byte, 0, 4096),
		MaxSize: consts.NetworkSizeLimit,
	}
	p.PackByte(typeID)
	if err := codec.LinearCodec.MarshalInto(action, p); err != nil {
		panic(err)
	}
	return p.Bytes
}

