"""
Seed database with sample data for development.
Run: python -m app.utils.seed_data
"""
import asyncio
import sys
from datetime import datetime, timedelta

sys.path.insert(0, '.')

from app.database import async_session_maker
from app.models import SubscriptionTier, Organization, License, Announcement, AdminUser
from app.utils.security import get_password_hash
from app.utils.license_utils import generate_license_key


async def seed_data():
    print("\n=== Seeding Database ===\n")
    
    async with async_session_maker() as session:
        # Create subscription tiers
        print("Creating subscription tiers...")
        tiers = [
            SubscriptionTier(
                name="Starter",
                code="starter",
                description="Perfect for small libraries",
                price_monthly=29.99,
                price_annual=299.99,
                max_users=5,
                max_records=10000,
                features=["Basic catalog", "Circulation", "Email support"],
                is_active=True,
            ),
            SubscriptionTier(
                name="Professional",
                code="professional",
                description="For growing libraries",
                price_monthly=79.99,
                price_annual=799.99,
                max_users=25,
                max_records=100000,
                features=["Full catalog", "Circulation", "Acquisitions", "Reports", "Priority support"],
                is_active=True,
            ),
            SubscriptionTier(
                name="Enterprise",
                code="enterprise",
                description="For large institutions",
                price_monthly=199.99,
                price_annual=1999.99,
                max_users=100,
                max_records=1000000,
                features=["Full catalog", "Circulation", "Acquisitions", "Serials", "ILL", "Advanced reports", "API access", "Dedicated support"],
                is_active=True,
            ),
        ]
        for tier in tiers:
            session.add(tier)
        await session.flush()
        
        # Create sample organizations
        print("Creating sample organizations...")
        orgs = [
            Organization(
                organization_id="ORG-001",
                name="Springfield Public Library",
                location="Springfield, IL",
                email="contact@springfieldlibrary.org",
                phone="+1 555-123-4567",
                contact_person="Lisa Simpson",
                is_active=True,
            ),
            Organization(
                organization_id="ORG-002",
                name="Riverside Academic Library",
                location="Riverside, CA",
                email="admin@riverside.edu",
                phone="+1 555-987-6543",
                contact_person="John Smith",
                is_active=True,
            ),
        ]
        for org in orgs:
            session.add(org)
        await session.flush()
        
        # Create sample licenses
        print("Creating sample licenses...")
        licenses = [
            License(
                license_key=generate_license_key(),
                organization_id=orgs[0].id,
                tier_id=tiers[1].id,  # Professional
                expiry_date=datetime.utcnow() + timedelta(days=365),
                max_activations=5,
                is_active=True,
            ),
            License(
                license_key=generate_license_key(),
                organization_id=orgs[1].id,
                tier_id=tiers[2].id,  # Enterprise
                expiry_date=datetime.utcnow() + timedelta(days=180),
                max_activations=10,
                is_active=True,
            ),
        ]
        for lic in licenses:
            session.add(lic)
        
        # Create sample announcements
        print("Creating sample announcements...")
        announcements = [
            Announcement(
                title="Welcome to Libro 2.0",
                content="<p>We're excited to announce the release of <strong>Libro 2.0</strong>!</p><p>New features include:</p><ul><li>Improved catalog search</li><li>New reporting dashboard</li><li>Mobile-friendly interface</li></ul>",
                priority="high",
                is_active=True,
                is_public=True,
                start_date=datetime.utcnow(),
            ),
            Announcement(
                title="Scheduled Maintenance",
                content="<p>We will be performing scheduled maintenance on <strong>February 1st, 2026</strong> from 2:00 AM to 4:00 AM UTC.</p><p>The service may be briefly unavailable during this time.</p>",
                priority="normal",
                is_active=True,
                is_public=True,
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=7),
            ),
        ]
        for ann in announcements:
            session.add(ann)
        
        await session.commit()
        
        print("\n✓ Database seeded successfully!")
        print(f"  - {len(tiers)} subscription tiers")
        print(f"  - {len(orgs)} organizations")
        print(f"  - {len(licenses)} licenses")
        print(f"  - {len(announcements)} announcements")
        print("\nSample license keys:")
        for lic in licenses:
            print(f"  - {lic.license_key} ({orgs[licenses.index(lic)].name})")
        print()


if __name__ == "__main__":
    asyncio.run(seed_data())
