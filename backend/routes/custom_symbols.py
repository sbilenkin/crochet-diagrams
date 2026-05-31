from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user, get_db
from models import User, UserCustomSymbol
from schemas.custom_symbol import (
    CustomSymbolCreate,
    CustomSymbolResponse,
    CustomSymbolUpdate,
)

router = APIRouter(prefix="/api/custom-symbols", tags=["custom-symbols"])


def _owned_or_404(db: Session, symbol_id: UUID, user: User) -> UserCustomSymbol:
    symbol = (
        db.query(UserCustomSymbol)
        .filter(
            UserCustomSymbol.id == symbol_id,
            UserCustomSymbol.user_id == user.user_id,
        )
        .first()
    )
    if symbol is None:
        raise HTTPException(status_code=404, detail="Custom symbol not found")
    return symbol


@router.get("", response_model=list[CustomSymbolResponse])
def list_custom_symbols(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[UserCustomSymbol]:
    return (
        db.query(UserCustomSymbol)
        .filter(UserCustomSymbol.user_id == current_user.user_id)
        .order_by(UserCustomSymbol.created_at)
        .all()
    )


@router.post("", response_model=CustomSymbolResponse, status_code=201)
def create_custom_symbol(
    payload: CustomSymbolCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserCustomSymbol:
    symbol = UserCustomSymbol(
        user_id=current_user.user_id,
        name=payload.name,
        width=payload.width,
        height=payload.height,
        paths=payload.paths,
        anchors=payload.anchors,
    )
    db.add(symbol)
    db.commit()
    db.refresh(symbol)
    return symbol


@router.put("/{symbol_id}", response_model=CustomSymbolResponse)
def update_custom_symbol(
    symbol_id: UUID,
    payload: CustomSymbolUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserCustomSymbol:
    symbol = _owned_or_404(db, symbol_id, current_user)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(symbol, field, value)
    db.commit()
    db.refresh(symbol)
    return symbol


@router.delete("/{symbol_id}", status_code=204)
def delete_custom_symbol(
    symbol_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    symbol = _owned_or_404(db, symbol_id, current_user)
    db.delete(symbol)
    db.commit()
