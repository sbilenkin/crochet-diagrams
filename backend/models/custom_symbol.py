import uuid
from sqlalchemy import Column, ForeignKey, Integer, String, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID, JSONB

from db.database import Base


class UserCustomSymbol(Base):
    __tablename__ = "user_custom_symbols"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(255), nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    paths = Column(JSONB, nullable=False)
    anchors = Column(JSONB, nullable=False)
    created_at = Column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
